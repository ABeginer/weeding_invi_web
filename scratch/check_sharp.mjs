try {
  const sharp = await import("sharp");
  console.log("sharp is available!");
} catch (e) {
  console.log("sharp is NOT available:", e.message);
}

