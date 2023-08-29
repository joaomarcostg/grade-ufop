const romanAlgs = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

export function capitalize(value?: string | null) {
  if (!value) {
    return "";
  }

  const words = value.split(" ");
  const capitalizedWords = words.map((word) => {
    if (word === "E" || word === "DE" ) {
      return word.toLowerCase();
    }

    if (romanAlgs.includes(word)) {
      return word;
    }

    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  return capitalizedWords.join(" ");
}
