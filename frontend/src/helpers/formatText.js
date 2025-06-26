export const formatTextByDelimiter = (text) => {
  let introText = "";
  let listContentRaw = "";
  let firstDelimiterIndex = -1;

  const match = text.match(/[:;]/);
  if (match) {
    firstDelimiterIndex = text.indexOf(match[0]);
  }

  if (firstDelimiterIndex === -1) {
    return text.trim();
  } else {
    introText = text.substring(0, firstDelimiterIndex + 1).trim();
    listContentRaw = text.substring(firstDelimiterIndex + 1).trim();
  }

  const segmentsWithDelimiters = listContentRaw.split(/([:;])/g);

  let finalSegments = [];
  let currentSegmentBuffer = "";

  for (let i = 0; i < segmentsWithDelimiters.length; i++) {
    const part = segmentsWithDelimiters[i];

    if (part === ":" || part === ";") {
      currentSegmentBuffer += part;
      if (currentSegmentBuffer.trim() !== "") {
        finalSegments.push(currentSegmentBuffer.trim());
      }
      currentSegmentBuffer = "";
    } else if (part.trim() !== "") {
      currentSegmentBuffer += part;
    }
  }

  if (currentSegmentBuffer.trim() !== "") {
    finalSegments.push(currentSegmentBuffer.trim());
  }

  if (finalSegments.length === 0) {
    return introText;
  }

  const listItemsHtml = finalSegments
    .map((segment) => {
      return `<li class="mt-2 -ml-2">${segment}</li>`;
    })
    .join("");

  return `${introText}<ul class="list-disc">${listItemsHtml}</ul>`;
};
