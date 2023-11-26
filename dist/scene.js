"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unload = exports.load = exports.methods = void 0;
const path_1 = require("path");
module.paths.push((0, path_1.join)(Editor.App.path, 'node_modules'));
const cc_1 = require("cc");
let fs = require("fs");
/**
 * @en Registration method for the main process of Extension
 * @zh 为扩展的主进程的注册方法
 */
exports.methods = {
    async binder_nodes(uuid) {
        console.log("=========绑定UI节点开始=========");
        await binder_nodes(uuid);
        console.log("=========绑定UI节点结束=========");
    },
    async auto_gen_code(uuid) {
        console.log("=========生成UI代码开始=========");
        await auto_gen_code(uuid);
        console.log("=========生成UI代码结束=========");
    },
    async auto_gen_code_and_binder(uuid) {
        console.log("=========生成UI代码开始=========");
        await auto_gen_code(uuid);
        console.log("=========生成UI代码结束=========");
        console.log("=========绑定UI节点开始=========");
        await binder_nodes(uuid);
        console.log("=========绑定UI节点结束=========");
    },
    print_mapping_rules() {
        console.log("%c映射规则:", "color:green", HeadMenu);
    }
};
/**
 * @en Hooks triggered after extension loading is complete
 * @zh 扩展加载完成后触发的钩子
 */
function load() {
    // console.log('scene load');
}
exports.load = load;
/**
 * @en Hooks triggered after extension uninstallation is complete
 * @zh 扩展卸载完成后触发的钩子
 */
function unload() {
    // console.log('scene load');
}
exports.unload = unload;
async function auto_gen_code(uuid) {
    let node = cce.Node.query(uuid);
    if (!node) {
        console.error("没有找到需要的节点");
        return;
    }
    cacheChildren(node);
    let coms = node.getComponents(cc_1.Component);
    let findCustomCom = false;
    for (let com of coms) {
        let name = cc_1.js.getClassName(com);
        if (!name.startsWith("cc.")) {
            console.log("脚本名字: " + name);
            findCustomCom = true;
            let comUuid = Editor.Utils.UUID.decompressUUID(com['__cid__']);
            let path = await Editor.Message.request("asset-db", 'query-path', comUuid);
            console.log("脚本路径: " + path);
            let txt = fs.readFileSync(path, "utf-8");
            let patt = new RegExp(`${PattStart}[\\s\\S]*${PattEnd}\*`, "gm");
            let res = txt.match(patt);
            let data = res === null || res === void 0 ? void 0 : res.toString();
            parseText(data);
            if (res) {
                //console.log(res); 
            }
            else {
                console.log("=====脚本中没有发现替代注释  请在需要添加组件地方复制粘贴以下注释======");
                console.log(`/*${PattStart}*/`);
                console.log(`/*${PattEnd}*/`);
                return;
            }
            let str = `${PattStart}*/\n`;
            ChildrenMap.forEach((childs, key) => {
                if (childs) {
                    let child = childs[0];
                    if (!child.name.includes("_")) {
                        return;
                    }
                    let headName = getHeadString(child.name);
                    let type = HeadMenu[headName];
                    if (!type) {
                        return;
                    }
                    let old = oldCodeMap.get(child.name);
                    if (old) {
                        str += "\n\t" + old.content + "\n";
                    }
                    else {
                        let txmp = replace;
                        if (type) {
                            let name = child.name;
                            txmp = txmp.replace("{type}", type);
                            txmp = txmp.replace("{type}", type);
                            txmp = txmp.replace("{name}", name);
                        }
                        str += txmp;
                    }
                }
            });
            str += "\n/*" + PattEnd + "";
            res.toString();
            txt = txt.replace(res.toString(), str);
            //cc.log(txt); 
            console.log("自动生成代码成功^—^");
            fs.writeFileSync(path, txt);
            let assetUrl = await Editor.Message.request("asset-db", 'query-url', comUuid);
            await Editor.Message.request("asset-db", 'refresh-asset', assetUrl);
            // Editor.Message.send("asset-db", "open-asset", comUuid);
            return;
        }
    }
    if (!findCustomCom) {
        console.warn("没找到自定义脚本");
    }
}
async function binder_nodes(uuid) {
    let node = cce.Node.query(uuid);
    if (!node) {
        console.error("没有找到需要的节点");
        return;
    }
    cacheChildren(node);
    traveBinder(node);
    //刷新
    Editor.Selection.unselect("node", uuid);
    await delay(200);
    Editor.Selection.select("node", uuid);
    // Editor.Selection.update("node", [uuid]);
}
class Item {
    constructor() { this.name = ""; this.type = ""; this.content = ""; }
}
let HeadMenu = {
    "node": "Node",
    "scroll": "ScrollView",
    "text": "Label",
    "spr": "Sprite",
    "rich": "RichText",
    "btn": "Button",
    "bar": "ProgressBar",
    "edit": "EditBox",
    "video": "VideoPlayer",
    "bone": "dragonBones.ArmatureDisplay",
    "spine": "sp.Skeleton",
    "graph": "Graphics",
    "wgt": "Widget",
    "toggle": "Toggle",
    "slider": "Slider",
    "page": "PageView",
    "anim": "Animation",
};
let replace = '\n\
    /*property define start*/\n\
    @property({type:{type}, displayName:""})\n\
    private {name}:{type} = null;\n\
    /*property define end*/\n\
    ';
const PattStart = '===========================Auto Gen Start===========================';
const PattEnd = '===========================Auto Gen End===========================';
let ChildrenMap = new Map();
let oldCodeMap = new Map();
function parseText(txt) {
    oldCodeMap = new Map();
    if (!txt) {
        return;
    }
    let reg = txt.match(/\/\*property define start\*\/([\s\S]*?)\/\*property define end\*\//g);
    if (!reg) {
        return;
    }
    for (let i = 0; i < reg.length; i++) {
        let str = reg[i];
        let type = str.match(/type:([\s\S]*?),/);
        if (!type) {
            continue;
        }
        let type2 = type[0];
        type2 = type2.replace("type:", "");
        type2 = type2.replace(",", "");
        type2 = type2.trim();
        let name = str.match(/(private|public)([\s\S]*?):/);
        if (!name) {
            continue;
        }
        let name2 = name[0];
        name2 = name2.replace(/(private|public)/, "");
        name2 = name2.replace(":", "");
        name2 = name2.trim();
        let old = new Item();
        old.content = str;
        old.name = name2;
        old.type = type2;
        oldCodeMap.set(name, old);
    }
    // console.log(reg);
}
function getHeadString(str, fortmat = "_") {
    if (!str) {
        return str;
    }
    let res = str.split(fortmat);
    return res[0];
}
function traveBinder(node) {
    let coms = node.getComponents(cc_1.Component);
    let findCustomCom = false;
    for (let com of coms) {
        let name = cc_1.js.getClassName(com);
        if (!name.startsWith("cc.")) {
            findCustomCom = true;
            //@ts-ignore
            let attrs = com.constructor.__attrs__;
            for (let key in attrs) {
                if (key.endsWith("ctor")) {
                    let prot_name = key.substring(0, key.indexOf("$_$"));
                    if (prot_name !== "__scriptAsset") {
                        let prot_class = attrs[key];
                        let prot_type = attrs[key].name;
                        let children = ChildrenMap.get(prot_name);
                        if (children) {
                            let nodes = children.filter(node => {
                                if (prot_type == cc_1.Node.name) {
                                    return true;
                                }
                                return node.getComponent(prot_class);
                            });
                            if (nodes && nodes.length) {
                                let first = nodes[0];
                                let needCom = null;
                                if (prot_type == cc_1.Node.name) {
                                    needCom = first;
                                }
                                else {
                                    needCom = first.getComponent(prot_class);
                                }
                                com[prot_name] = needCom;
                                continue;
                            }
                            else {
                                console.warn(`${prot_name}没有对应的组件`);
                            }
                        }
                        else {
                            console.warn(`${prot_name}没有此节点`);
                        }
                    }
                }
            }
            console.log("自动绑定成功^—^");
            return;
        }
    }
    if (!findCustomCom) {
        console.warn("没找到自定义脚本");
    }
}
function cacheChildren(p) {
    ChildrenMap = new Map();
    _cacheChildren(p, ChildrenMap);
}
function _cacheChildren(p, cMap) {
    var _a;
    let children = p.children;
    for (let i = 0; i < children.length; i++) {
        let child = children[i];
        cMap.get(child.name) || (cMap.set(child.name, []));
        (_a = cMap.get(child.name)) === null || _a === void 0 ? void 0 : _a.push(child);
        if (child.children.length > 0) {
            _cacheChildren(child, cMap);
        }
    }
}
function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time);
    });
}
