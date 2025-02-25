
interface ToastNotificationProps {
  message: string;
}

export function ToastNotification({ message }: ToastNotificationProps) {
  return (
    <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow-lg">
      {message}
    </div>
  );
}
