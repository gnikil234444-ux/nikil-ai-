const pdfParse = require("pdf-parse");

async function readPDF(buffer) {
    try {
        const data = await pdfParse(buffer);

        return data.text;
    } catch (error) {
        console.log("PDF reading error:", error);
        return "Could not read PDF.";
    }
}

module.exports = {
    readPDF
};