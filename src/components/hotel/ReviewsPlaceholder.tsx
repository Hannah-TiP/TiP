interface ReviewsPlaceholderProps {
  title: string;
  body: string;
}

export default function ReviewsPlaceholder({ title, body }: ReviewsPlaceholderProps) {
  return (
    <div className="border border-gray-border bg-white p-8 text-center">
      <p className="font-primary text-[22px] italic text-green-dark">{title}</p>
      <p className="mt-3 text-[14px] leading-relaxed text-gray-text">{body}</p>
    </div>
  );
}
