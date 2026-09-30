export async function submitResponse(response) {
  const result = await fetch('/api/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(response),
  });

  if (!result.ok) {
    let message = 'Could not save your answers.';
    try {
      const body = await result.json();
      if (body?.error) message = body.error;
    } catch {
      // keep default
    }
    return { ok: false, error: message };
  }

  const body = await result.json();
  return { ok: true, id: body.id };
}

export async function submitDeveloperMessage(responseId, message) {
  const result = await fetch('/api/developer-message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ responseId, message }),
  });

  if (!result.ok) {
    let error = 'Could not send the note.';
    try {
      const body = await result.json();
      if (body?.error) error = body.error;
    } catch {
      // keep default
    }
    return { ok: false, error };
  }

  return { ok: true };
}
