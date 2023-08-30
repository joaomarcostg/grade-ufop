const romanAlgs = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const classTypeRegex = /\(T\+P\)|\(T\)|\(P\)/g;
const conectives = ["E", "DE", "DO", "DA"];

export function capitalize(value?: string | null) {
  if (!value) {
    return "";
  }

  const formatedvalue = value.replace(classTypeRegex, "");

  const words = formatedvalue.split(" ");
  const capitalizedWords = words.map((word) => {
    if (conectives.includes(word)) {
      return word.toLowerCase();
    }

    if (romanAlgs.includes(word)) {
      return word;
    }

    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  return capitalizedWords.join(" ");
}

export function convertDateToMinutes(date: Date | null) {
  if (date === null) return -1;
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}
