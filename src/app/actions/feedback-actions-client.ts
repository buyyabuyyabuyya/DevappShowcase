'use client';

// Client-side wrappers for server actions related to feedback
// This avoids importing server-only code in client components

import { editFeedbackAction as serverEditFeedback, deleteFeedbackAction as serverDeleteFeedback } from './feedback-actions';

// Client-friendly version of editFeedbackAction
export function editFeedbackAction(
  appId: string,
  feedbackId: string,
  text: string
) {
  return serverEditFeedback(appId, feedbackId, text);
}

// Client-friendly version of deleteFeedbackAction
export function deleteFeedbackAction(
  appId: string,
  feedbackId: string
) {
  return serverDeleteFeedback(appId, feedbackId);
}
