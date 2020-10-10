import DatabaseAccessor from './DatabaseAccessor';
import PlayItem from './PlayItem';
import Path from "path"
import fs, { Dirent } from "fs";
import AppConfig from './AppConfig';
import NotificationService from './NotificationService';


export default class LibraryService {
  
  _databaseAccessor: DatabaseAccessor;
  _notificationService: NotificationService;
  
  constructor(dba: DatabaseAccessor, ns: NotificationService) {
    this._databaseAccessor = dba;
    this._notificationService = ns;
  }

  
  getLibrary() {
    return this._databaseAccessor.selectLibrary();
  }

  getAllLibraryFilePaths() {
    return this._databaseAccessor.selectAllLibraryFilePaths();
  }

  async updateLibrary(playItems: PlayItem[]) {
    if (playItems.length == 0) return;

    const directories = playItems.map(p=> Path.dirname(p.filePath))
    const baseDirctory = this.getMostUseDirectory(directories);
    const movFiles = this.getAllFiles(baseDirctory, AppConfig.SupportFileExts);
    const registedFiles = await (await this.getAllLibraryFilePaths()).map(p=>p.FILEPATH);
    
    this._databaseAccessor.transaction(db=>{
      movFiles.forEach(f=>{
        if (!registedFiles.includes(f))  {
          try {
            const mediaFile = File.createFromPath(f);
            this._notificationService.push(mediaFile.toString());
          } catch {}
        }
      });
    });
    
  }

  private getAllFiles(dir:string, exts:string[],  files:string[] = []) {
    // TODO: ライブラリに追加する
    const dirents:Dirent[] = fs.readdirSync(dir, { withFileTypes: true });
    const dirs:string[] = [];
    for (const dirent of dirents) {
      if (dirent.isDirectory()) dirs.push(`${dir}\\${dirent.name}`);
      if (dirent.isFile()) {
        const filepath = `${dir}\\${dirent.name}`;
        if (exts.includes(Path.extname(filepath).toLowerCase())) files.push(filepath);
      }
    }
    for (const d of dirs) {
      files = this.getAllFiles(d, exts, files);
    }
    return files;
  };

  private getMostUseDirectory(directories: string[]) {
    // TODO: ライブラリに追加する
    const countMap = new Map<string, number>();

    directories.forEach(d=>{
      let value = countMap.get(d) ?? 0;
      countMap.set(d, ++value);
    });

    let maxKey = "";
    let maxValue = 0;
    countMap.forEach((value,key)=>{
      if (maxValue < value) {
        maxKey = key;
        maxValue = value;
      }
    })

    return maxKey;
  }
}