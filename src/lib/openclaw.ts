// OpenClaw Sessions Integration
// This connects the dashboard to actual OpenClaw agent spawning

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://host.docker.internal:18789';
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN;

interface SpawnAgentRequest {
  name: string;
  task: string;
  agentId: string;
}

export async function spawnOpenClawAgent({ name, task, agentId }: SpawnAgentRequest) {
  try {
    // Spawn a sub-agent via OpenClaw Gateway
    const response = await fetch(`${GATEWAY_URL}/v1/sessions/spawn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GATEWAY_TOKEN}`,
      },
      body: JSON.stringify({
        label: `agent-${agentId}`,
        task: `You are ${name}, an AI agent working on: ${task}\n\n` +
               `Your mission:\n` +
               `1. Work on the assigned task\n` +
               `2. Report progress via POST to dashboard API\n` +
               `3. Ask for help when stuck\n\n` +
               `Task: ${task}`,
        agentId: 'default', // Uses default OpenClaw agent
        runTimeoutSeconds: 3600, // 1 hour max
        cleanup: 'keep', // Keep session for review
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to spawn agent: ${error}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      sessionKey: data.sessionKey,
      message: `Agent ${name} spawned successfully`,
    };
  } catch (error: any) {
    console.error('Error spawning agent:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function getAgentSessions() {
  try {
    const response = await fetch(`${GATEWAY_URL}/v1/sessions`, {
      headers: {
        'Authorization': `Bearer ${GATEWAY_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch sessions');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return { sessions: [] };
  }
}

export async function sendMessageToAgent(sessionKey: string, message: string) {
  try {
    const response = await fetch(`${GATEWAY_URL}/v1/sessions/${sessionKey}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GATEWAY_TOKEN}`,
      },
      body: JSON.stringify({ message }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
}