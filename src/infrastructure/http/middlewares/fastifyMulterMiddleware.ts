import { randomBytes } from 'crypto';
import multer from 'fastify-multer';
import fs from 'fs'; // Importar o módulo fs

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const extension = file.originalname.split('.').pop();

    let dir = './temp/images/';

    if (extension === 'csv') {
      dir = './temp/csv/';
    }

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const extension = file.originalname.split('.').pop();
    const newFileName = randomBytes(20).toString('hex');
    cb(null, `${newFileName}.${extension}`);
  },
});

type MulterType = ReturnType<typeof multer>;

export const upload: MulterType = multer({ storage });
