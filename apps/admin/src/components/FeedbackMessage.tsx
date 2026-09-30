import { Feedback } from "../domain/feedback";

export function FeedbackMessage({ feedback }: { feedback: Feedback | null }) {
  if (!feedback) return null;
  return feedback.kind === "error"
    ? <p className="error" role="alert">{feedback.text}</p>
    : <p className="notice" role="status">{feedback.text}</p>;
}
