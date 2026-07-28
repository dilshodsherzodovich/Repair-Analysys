export const formatDate = (
  dateTimeString: string,
  view: "datetime" | "date" | "time" = "datetime"
) => {
  if (dateTimeString) {
    const dateTime = new Date(dateTimeString);
    const year = dateTime.getFullYear();
    const month = String(dateTime.getMonth() + 1).padStart(2, "0");
    const day = String(dateTime.getDate()).padStart(2, "0");
    const hours = String(dateTime.getHours()).padStart(2, "0");
    const minutes = String(dateTime.getMinutes()).padStart(2, "0");
    if (view === "datetime") {
      return `${day}.${month}.${year} ${hours}:${minutes}`;
    } else if (view === "date") {
      return `${day}.${month}.${year}`;
    } else if (view === "time") {
      return `${hours}:${minutes}`;
    } else return null;
  } else return null;
};

export const getTimeFromDate = (dateString: string) => {
  if (dateString) {
    const dateTime = new Date(dateString);
    const hours = String(dateTime.getHours()).padStart(2, "0");
    const minutes = String(dateTime.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  } else {
    return "";
  }
};
