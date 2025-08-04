import { type ErrorCode, errorMessage } from '../constants/error.constants';
import { apiMessage, type ApiMessageKey } from '../constants/message.constants';

export function getApiMessage(key: ApiMessageKey): string {
  return apiMessage[key];
}

export function getErrorMessage(key: ErrorCode): string {
  return errorMessage[key];
}
