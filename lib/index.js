const fse = require("fs-extra");
const path = require("path");
const download = require("download-git-repo");
//1.只能在有 node_modules 的项目中使用

//获取当前项目的文件路径
const projectPath = path.resolve(__dirname.split("node_modules")[0]);
//当前项目的文件名
const projectName = path.basename(projectPath);

//复制项目的文件路径
const subPath = path.join(projectPath, "..");
//复制项目的文件名
let newProjectPath = path.join(subPath, `${projectName}-copy`);

function isFileExist(path, suffix = 1) {
  let isExist = fse.pathExistsSync(path);
  let tempPath = path;
  if (isExist) {
    tempPath = newProjectPath + suffix;
    isFileExist(tempPath, ++suffix);
  } else {
    newProjectPath = tempPath;
  }
}

//判断文件夹是否存在  newProjectPath
isFileExist(newProjectPath);

console.log("正在下载模板中...");

//从仓库下载模板
download("badspider7/uni-preset-vue", newProjectPath, function (err) {
  console.log(err ? "Error" : "下载完成");
  // })

  const ignoreFile = [
    "node_modules",
    "package.json",
    ".gitignore",
    "package-lock.json",
    "readme.md",
  ];

  const srcPath = path.join(newProjectPath, "src");

  //过滤掉的文件
  const filterArr = [];

  //过滤掉不需要的文件
  function filterFunc(src, dest) {
    if (ignoreFile.includes(path.basename(src))) {
      if (path.basename(src) !== "node_modules") {
        filterArr.push(src);
      }
      return false;
    }
    return true;
  }

  //额外处理 package.json 和 package-lock.json
  function handleJson(packagePath) {
    if (path.basename(packagePath) == "package.json") {
      const packageOBJ = fse.readJsonSync(
        path.join(newProjectPath, "package.json")
      );
      const oldPackageOBJ = fse.readJsonSync(packagePath);
      let dependencies = Object.assign(
        packageOBJ.dependencies,
        oldPackageOBJ.dependencies
      );
      let devDependencies = Object.assign(
        packageOBJ.devDependencies,
        oldPackageOBJ.devDependencies
      );
      packageOBJ.name = oldPackageOBJ.name;
      packageOBJ.dependencies = dependencies;
      packageOBJ.devDependencies = devDependencies;
      fse.writeJsonSync(path.join(newProjectPath, "package.json"), packageOBJ);
    } else {
      //不用管 package-lock.json 执行 npm i 的时候会自动重新生成
      const packageLockOBJ = fse.readJsonSync(
        path.join(newProjectPath, "package-lock.json")
      );
      const oldPackageOBJ = fse.readJsonSync(packagePath);
      Object.keys(oldPackageOBJ).forEach((item) => {
        // console.log('packageLockOBJ',packageLockOBJ[item])
        // console.log('oldPackageOBJ',oldPackageOBJ[item])
      });
    }
  }

  //把过滤掉的文件copy到src之外
  function copyFilterToDest() {
    filterArr.forEach((item) => {
      //package.json 和 package-lock.json 需要额外处理
      if (
        path.basename(item) == "package.json" ||
        path.basename(item) == "package-lock.json"
      ) {
        handleJson(item);
      } else {
        fse.copySync(item, path.join(newProjectPath, path.basename(item)));
      }
    });
  }

  //复制项目副本
  fse.copy(projectPath, srcPath, { filter: filterFunc }, (err) => {
    if (err) {
      return console.log(err);
    } else {
      //把过滤掉的文件copy到src之外
      copyFilterToDest();
    }
  });

  console.log("转换完成!");
});
