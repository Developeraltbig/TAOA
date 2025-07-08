export const formatTextByDelimiter = (text) => {
  text = text.replace(/\r\n|\r/g, "\n");

  const lines = text.split("\n");

  let introText = "";
  const listSegments = [];

  if (lines.length > 0) {
    introText = lines[0].trim();

    for (let i = 1; i < lines.length; i++) {
      const segment = lines[i].trim();
      if (segment !== "") {
        listSegments.push(segment);
      }
    }
  } else {
    return "";
  }

  if (listSegments.length === 0) {
    return introText;
  }

  const listItemsHtml = listSegments
    .map((segment) => {
      return `<li class="mt-2">${segment}</li>`;
    })
    .join("");

  return `${introText}<ul class="list-disc">${listItemsHtml}</ul>`;
};

export const formatTextToParagraphs = (text) => {
  text = text.replace(/\r\n|\r/g, "\n");
  const lines = text.split("\n");

  const nonEmptyLines = lines
    .map((line) => line.trim())
    .filter((line) => line !== "");

  if (nonEmptyLines.length === 0) {
    return "";
  }

  return nonEmptyLines.join("<br><br>");
};

export const formatTextToDelimiter = (text) => {
  text = text.replace(/\r\n|\r/g, "\n");

  const lines = text.split("\n");

  let introText = "";
  const listSegments = [];

  if (lines.length > 0) {
    introText = lines[0].trim();

    for (let i = 1; i < lines.length; i++) {
      const segment = lines[i].trim();
      if (segment !== "") {
        listSegments.push(segment);
      }
    }
  } else {
    return "";
  }

  if (listSegments.length === 0) {
    return introText;
  }

  const listItemsHtml = listSegments
    .map((segment) => {
      return `<li class="mt-2">${segment}</li>`;
    })
    .join("");

  return `${introText}<ul class="list-disc pl-5">${listItemsHtml}</ul>`;
};
