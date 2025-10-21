import { NextRequest, NextResponse } from 'next/server';
import { IARequest, IAResponse, Direction } from '@/lib/types';
import { MockIA } from '@/lib/mockIA';

// POST /api/ia/move - Proxy vers le serveur Python IA
export async function POST(request: NextRequest) {
  let body: IARequest = {} as IARequest;
  
  try {
    body = await request.json();
    
    // Validation des données
    if (!body.mouseId || !body.position || !body.environment || !body.mouseState) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields in IA request'
        },
        { status: 400 }
      );
    }
    
    // Vérifier si le serveur Python IA est configuré
        const pythonServerUrl = process.env.PYTHON_IA_SERVER_URL || 'http://localhost:8000';
        const isPythonServerConfigured = true; // Always try to use Python server
    
    let iaResponse: IAResponse;
    
    if (isPythonServerConfigured) {
      // Essayer de contacter le serveur Python IA
      try {
        const iaEndpoint = `${pythonServerUrl}/api/move`;
        
        const response = await fetch(iaEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          // Timeout de 5 secondes
          signal: AbortSignal.timeout(5000)
        });
        
        if (!response.ok) {
          throw new Error(`Python IA server responded with status: ${response.status}`);
        }
        
        const pythonResponse = await response.json();
        
        // Convert Python response to our format
        iaResponse = {
          mouseId: pythonResponse.mouseId,
          move: pythonResponse.move,
          reasoning: pythonResponse.reasoning
        };
      } catch (error) {
        console.log('Serveur Python IA non disponible, utilisation de l\'IA mockée');
        iaResponse = MockIA.getMove(body);
      }
    } else {
      // Utiliser l'IA mockée
      console.log('Serveur Python IA non configuré, utilisation de l\'IA mockée');
      iaResponse = MockIA.getMove(body);
    }
    
    // Validation de la réponse
    if (!iaResponse.mouseId || !iaResponse.move) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid response from Python IA server'
        },
        { status: 500 }
      );
    }
    
    // Vérifier que le mouvement est valide
    const validMoves: Direction[] = ['north', 'south', 'east', 'west'];
    if (!validMoves.includes(iaResponse.move)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid move direction from Python IA server'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: iaResponse
    });
    
  } catch (error) {
    console.error('Error in IA move endpoint:', error);
    
    // En cas d'erreur, utiliser l'IA mockée comme fallback
    const fallbackResponse: IAResponse = MockIA.getMove(body);
    
    return NextResponse.json({
      success: true,
      data: fallbackResponse,
      warning: 'Using mock IA due to error'
    });
  }
}

// GET /api/ia/move - Vérifier la disponibilité du serveur Python IA
export async function GET(request: NextRequest) {
  try {
    const pythonServerUrl = process.env.PYTHON_IA_SERVER_URL || 'http://localhost:8000';
    const healthEndpoint = `${pythonServerUrl}/api/health`;
    
    const response = await fetch(healthEndpoint, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });
    
    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Python IA server is available',
        status: 'connected'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Python IA server is not responding',
        status: 'disconnected'
      });
    }
    
  } catch (error) {
    console.error('Error checking Python IA server status:', error);
    return NextResponse.json({
      success: false,
      message: 'Python IA server is not available',
      status: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
