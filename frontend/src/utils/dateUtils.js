export const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

export const formatTime = (timeString) => {
  if (!timeString) return "-";
  const [hours, minutes] = timeString.split(":");
  if (hours === undefined || minutes === undefined) return timeString;
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const formattedHours = h % 12 || 12;
  return `${formattedHours}:${minutes} ${ampm}`;
};

export const isDateExpired = (endDate) => {
  if (!endDate) return false;
  return new Date(endDate) < new Date();
};
