import fs from 'fs';
import pdf from 'pdf-parse';

let dataBuffer = fs.readFileSync('c:/Users/thvs1/Downloads/InterestSphere-main/template/rtfp_final[1].pdf');

pdf(dataBuffer).then(function(data) {
    fs.writeFileSync('sample_pdf_text.txt', data.text);
    console.log("PDF text extracted successfully.");
});
