export async function generateCommand(input: string) {
  const text = input.toLowerCase();

  // === Add Objects ===
  if (text.includes("tree")) {
    const qty = parseInt(text.match(/\d+/)?.[0] || "1", 10);
    return {
      action: "add_object",
      object: { type: "tree", quantity: qty, position: "random" },
    };
  }

  if (text.includes("star")) {
    const qty = parseInt(text.match(/\d+/)?.[0] || "1", 10);
    return {
      action: "add_object",
      object: { type: "star", quantity: qty, position: "random" },
    };
  }

  if (text.includes("skyscraper") || text.includes("building")) {
    return {
      action: "add_object",
      object: { type: "skyscraper", quantity: 1, position: "random" },
    };
  }

  if (text.includes("rock")) {
    const qty = parseInt(text.match(/\d+/)?.[0] || "1", 10);
    return {
      action: "add_object",
      object: { type: "rock", quantity: qty, position: "random" },
    };
  }

  if (text.includes("house")) {
    return {
      action: "add_object",
      object: { type: "house", quantity: 1, position: "random" },
    };
  }

  if (text.includes("car")) {
    return {
      action: "add_object",
      object: { type: "car", quantity: 1, position: "random", color: "red" },
    };
  }

  if (text.includes("cloud")) {
    const qty = parseInt(text.match(/\d+/)?.[0] || "1", 10);
    return {
      action: "add_object",
      object: { type: "cloud", quantity: qty, position: "random" },
    };
  }

  if (text.includes("mountain")) {
    return {
      action: "add_object",
      object: { type: "mountain", quantity: 1, position: "random" },
    };
  }

  // === Remove Objects ===
  if (text.startsWith("remove")) {
    if (text.includes("tree"))
      return { action: "remove_object", object: { type: "tree" } };
    if (text.includes("car"))
      return { action: "remove_object", object: { type: "car" } };
    if (text.includes("star"))
      return { action: "remove_object", object: { type: "star" } };
  }

  // === Modify World (Sky) ===
  if (text.includes("sky")) {
    if (text.includes("pink"))
      return { action: "modify_world", changes: { sky_color: "pink" } };
    if (text.includes("blue"))
      return { action: "modify_world", changes: { sky_color: "blue" } };
    if (text.includes("purple"))
      return { action: "modify_world", changes: { sky_color: "purple" } };
  }

  // === Fallback ===
  return { action: "noop" };
}
