const fs = require('fs');
const pdf = require('pdf-parse');

async function run() {
    let dataBuffer = fs.readFileSync('c:/Users/thvs1/Downloads/InterestSphere-main/template/rtfp_final[1].pdf');
    try {
        let data = await pdf(dataBuffer); // Some versions export the function directly
        fs.writeFileSync('sample_pdf_text.txt', data.text);
        console.log("PDF text extracted successfully.");
    } catch (e) {
        // Try PDFParse if it exists
        if (pdf.PDFParse) {
             let data = await pdf.PDFParse(dataBuffer);
             fs.writeFileSync('sample_pdf_text.txt', data.text);
             console.log("PDF text extracted successfully using PDFParse.");
        } else {
             console.error("Failed to parse PDF", e);
        }
    }
}
run();
