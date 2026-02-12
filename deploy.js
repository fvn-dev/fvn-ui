import readline from 'readline';
import { readFileSync, promises } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import AWS from 'aws-sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));

const { readFile, readdir } = promises;

const s3 = new AWS.S3({
    signatureVersion: 'v4',
    accessKeyId: process.env.S3_KEY,
    secretAccessKey: process.env.S3_SECRET,
    region: 'eu-west-1'
});

const PREFIX = pkg.name;
const BUCKET = pkg.bucket || 'fvnmm';
const DIR = './dist/';

const getMime = (() => {
    const types = {"epub":"application/epub+zip","gz":"application/gzip","jar":"application/java-archive","json":"application/json","jsonld":"application/ld+json","doc":"application/msword","bin":"application/octet-stream","ogx":"application/ogg","pdf":"application/pdf","rtf":"application/rtf","azw":"application/vnd.amazon.ebook","mpkg":"application/vnd.apple.installer+xml","xul":"application/vnd.mozilla.xul+xml","xls":"application/vnd.ms-excel","eot":"application/vnd.ms-fontobject","ppt":"application/vnd.ms-powerpoint","odp":"application/vnd.oasis.opendocument.presentation","ods":"application/vnd.oasis.opendocument.spreadsheet","odt":"application/vnd.oasis.opendocument.text","pptx":"application/vnd.openxmlformats-officedocument.presentationml.presentation","xlsx":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","docx":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","rar":"application/vnd.rar","vsd":"application/vnd.visio","7z":"application/x-7z-compressed","abw":"application/x-abiword","bz":"application/x-bzip","bz2":"application/x-bzip2","csh":"application/x-csh","arc":"application/x-freearc","php":"application/x-httpd-php","sh":"application/x-sh","swf":"application/x-shockwave-flash","tar":"application/x-tar","xhtml":"application/xhtml+xml","zip":"application/zip","midi":"audio/midi","mp3":"audio/mpeg","oga":"audio/ogg","opus":"audio/opus","wav":"audio/wav","weba":"audio/webm","aac":"audio/aac","otf":"font/otf","ttf":"font/ttf","woff":"font/woff","woff2":"font/woff2","bmp":"image/bmp","gif":"image/gif","jpeg":"image/jpeg","jpg":"image/jpeg","png":"image/png","svg":"image/svg+xml","tif":"image/tiff","tiff":"image/tiff","ico":"image/vnd.microsoft.icon","webp":"image/webp","ics":"text/calendar","css":"text/css","csv":"text/csv","htm":"text/html","html":"text/html","mjs":"text/javascript","js":"text/javascript","txt":"text/plain","xml":"text/xml","3gp":"video/3gpp","3g2":"video/3gpp2","ts":"video/mp2t","mpeg":"video/mpeg","ogv":"video/ogg","webm":"video/webm","avi":"video/x-msvideo"};
    return (file = '', fallback = 'text/html') => (file && types[file.split('.').pop()]) || fallback;
})();

const paths = [];

const makePaths = async (folder, sub = '') => {
    const files = await readdir(folder + sub);

    for (let file of files) {
        !file.includes('.') 
            ? await makePaths(folder, (sub ? '/' : '') + file + '/')
            : paths.push({ 
                mime: getMime(file), 
                path: PREFIX + '/' + sub + file, 
                source: folder + sub + file 
            });
    }
};

const uploadFile = ({ Key, Body, ContentType = 'application/json', Bucket = BUCKET }) => new Promise((resolve, reject) => {
    const config = {
        ACL: 'public-read',
        Bucket,
        Key,
        Body,
        ContentType
      };

    s3.putObject(config, error => {
        if (error) return reject(error);
        resolve();
    });
});

const uploadDir = async folder => {
    await makePaths(folder);
    
    console.log(`\x1Bc\nDeploying \x1b[33m${PREFIX}\x1b[0m`);

    for (const { mime, path, source } of paths) {
        process.stdout.write('Uploading \x1b[35m' + path + '\x1b[0m');

        try {
            await uploadFile({
                Key: path,
                Body: await readFile(source),
                ContentType: mime
            });
        }
        catch(err) {
            console.log('ERROR', path, err);
        }

        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
    }

    console.log('\x1b[35m--- Done ---\x1b[0m')
    console.log(`https://${BUCKET}.s3-eu-west-1.amazonaws.com/${PREFIX}/index.html`)
    console.log(`https://${BUCKET}.s3.amazonaws.com/${PREFIX}/index.html`)
}

uploadDir(DIR);
