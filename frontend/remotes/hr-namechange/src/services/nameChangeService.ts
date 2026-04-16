const HR_SERVICE_URL = process.env.HR_SERVICE_URL || 'http://localhost:8081';

export interface NameChangePayload {
  employeeId: string;
  previousName: string;
  newLastName: string;
  documentType: string;
  file: File;
}

export interface NameChangeResponse {
  requestId: string;
  status: string;
  message: string;
  confirmationCode?: string;
}

export async function submitNameChange(payload: NameChangePayload): Promise<NameChangeResponse> {
  const formData = new FormData();
  formData.append('employeeId', payload.employeeId);
  formData.append('previousName', payload.previousName);
  formData.append('newLastName', payload.newLastName);
  formData.append('documentType', payload.documentType);
  formData.append('file', payload.file);

  const response = await fetch(`${HR_SERVICE_URL}/hr/name-change`, {
    method: 'POST',
    body: formData,
    // Do NOT set Content-Type — browser sets it with the correct multipart boundary
  });

  if (!response.ok) {
    let errorMessage = `HR service error: ${response.status}`;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.message || errorMessage;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<NameChangeResponse>;
}
