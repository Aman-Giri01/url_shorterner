import path from "path";
import fs from "fs/promises";
import ejs from "ejs";
import mjml2html from "mjml";
export const getHtmlFromMjmlTemplate=async(template,data)=>{
// 1. read the data
const mjmlTemplate=await fs.readFile(path.join(import.meta.dirname,"..","emails",`${template}.mjml`),"utf-8");

// 2. replace the placeholder

const filledTemplate=ejs.render(mjmlTemplate,data);

// 3. convert file into html file

return mjml2html(filledTemplate).html;
};