"use strict";
let old = cc._decorator.ccclass;
const TOOL_CACHE_KEY = '__TOOL_CACHE_KEY__';
const CACHE_KEY = '__ccclassCache__';
if (!cc._decorator.ccclass["isnew"]) {
    cc._decorator.ccclass = function (ctor, name) {
        let s = ctor[CACHE_KEY];
        ctor[TOOL_CACHE_KEY] = ctor[CACHE_KEY]; let wu = ctor[TOOL_CACHE_KEY]; let ret = old.call(this, ctor, name); return ret;
    };
}
cc._decorator.ccclass["isnew"] = true;
const Log = require("./log");
const fs = require('fire-fs');
let HeadMenu = {
    "node": "cc.Node",
    "list": "cc.ScrollView",
    "lbl": "cc.Label",
    "spr": "cc.Sprite",
    "rich": "cc.RichText",
    "btn": "cc.Button",
    "bar": "cc.ProgressBar",
    "edit": "cc.EditBox",
    "video": "cc.VideoPlayer",
    "bone": "dragonBones.ArmatureDisplay",
};
let replace = '\n\
    /*property define start*/\n\
    @property({type:{type}, displayName:""})\n\
    private {name}:{type} = null;\n\
    /*property define end*/\n\
    ';
const PattStart = '===========================Auto Gen Start===========================';
const PattEnd = '===========================Auto Gen End===========================';
var scene; (function (scene) {
    class Node { constructor() { this.name = ""; this.type = ""; this.content = ""; } }
    let ChildrenMap = new Map();
    let oldCodeMap = new Map();
    function binder_nodes(evt, uuid) {
        Log.i("=========绑定UI节点开始=========");
        let node = cc.engine.getInstanceById(uuid);
        if (!node) { Log.e("没有找到需要的节点"); return; }
        cacheChildren(node);
        traveBinder(node);
        Log.i("=========绑定UI节点结束=========");
    }
    scene.binder_nodes = binder_nodes;
    function auto_gen_code(evt, uuid) {
        Log.i("=========生成UI代码开始=========");
        function handle(evt, uuid) {
            let node = cc.engine.getInstanceById(uuid);
            if (!node) { Log.e("没有找到需要的节点"); return; }
            cacheChildren(node);
            let coms = node.getComponents(cc.Component);
            let findCustomCom = false;
            for (let com of coms) {
                let name = cc.js.getClassName(com);
                if (!name.startsWith("cc.")) {
                    findCustomCom = true;
                    let comUuid = com.__scriptUuid;
                    // Log.i("uuid: " + comUuid);
                    let path = Editor.remote.assetdb.uuidToFspath(comUuid);
                    Log.i("脚本路径: " + path);
                    let txt = fs.readFileSync(path, "utf-8");
                    let patt = new RegExp(`${PattStart}[\\s\\S]*${PattEnd}\*`, "gm");
                    let res = txt.match(patt);
                    let data = res === null || res === void 0 ? void 0 : res.toString();
                    parseText(data);
                    if (res) {
                        //Editor.log(res); 
                    }
                    else {
                        Editor.log("=====脚本中没有发现替代注释  请在需要添加组件地方复制粘贴以下注释======");
                        Editor.log(`/*${PattStart}*/`);
                        Editor.log(`/*${PattEnd}*/`);
                        return;
                    }
                    let str = `${PattStart}*/\n`;
                    ChildrenMap.forEach((childs, key) => {
                        if (childs) {
                            let child = childs[0];
                            let headName = getHeadString(child.name);
                            //Editor.log(headName); 
                            let type = HeadMenu[headName];
                            if (!type) { return; }
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
                    Editor.log("自动生成代码成功^—^");
                    fs.writeFileSync(path, txt);
                    let assetPath = Editor.remote.assetdb.uuidToUrl(comUuid);
                    Editor.Ipc.sendToMain('assets:open-text-file', comUuid);
                    Editor.assetdb.refresh(assetPath); return;
                    let cache = com.constructor[TOOL_CACHE_KEY]; if (!cache) { Editsor.warn("====需要修改引擎=========="); return; }
                }
            }
            if (!findCustomCom) {
                Editor.warn("没找到自定义脚本");
            }
        }
        let ret = handle(evt, uuid);
        Log.i("=========生成UI代码结束=========");
    }
    scene.auto_gen_code = auto_gen_code;
    function parseText(txt) {
        oldCodeMap = new Map();
        if (!txt) { return; }
        let reg = txt.match(/\/\*property define start\*\/([\s\S]*?)\/\*property define end\*\//g);
        if (!reg) { return; }
        for (let i = 0; i < (reg === null || reg === void 0 ? void 0 : reg.length); i++) {
            let str = reg[i];
            let type = str.match(/type:([\s\S]*?),/)[0];
            if (!type) { continue; }
            type = type === null || type === void 0 ? void 0 : type.replace("type:", "");
            type = type === null || type === void 0 ? void 0 : type.replace(",", "");
            type = type.trim();
            let name = str.match(/(private|public)([\s\S]*?):/)[0];
            if (!name) { continue; }
            name = name === null || name === void 0 ? void 0 : name.replace(/(private|public)/, "");
            name = name === null || name === void 0 ? void 0 : name.replace(":", "");
            name = name.trim();
            let old = new Node();
            old.content = str;
            old.name = name;
            old.type = type;
            oldCodeMap.set(name, old);
        }
        // cc.log(reg);
    }
    scene.parseText = parseText;
    function getHeadString(str, fortmat = "_") {
        if (!str) { return str; }
        let res = str.split(fortmat); return res[0];
    }
    function traveBinder(node) {
        let coms = node.getComponents(cc.Component);
        let findCustomCom = false;
        for (let com of coms) {
            let name = cc.js.getClassName(com);
            if (!name.startsWith("cc.")) {
                findCustomCom = true;
                let cache = com.constructor[TOOL_CACHE_KEY];
                if (!cache) { Editor.warn("====关闭引擎重启=========="); return; }
                let properties = cache.proto.properties;
                for (let key in properties) {
                    if (com[key] === null) {
                        let data = properties[key];
                        let children = ChildrenMap.get(key);
                        if (children) {
                            let nodes = children.filter(node => {
                                if (data.type == cc.Node) { return true; }
                                return node.getComponent(data.type);
                            });
                            if (nodes && nodes.length) {
                                let first = nodes[0]; let needCom = null;
                                if (data.type == cc.Node) { needCom = first; }
                                else { needCom = first.getComponent(data.type); }
                                com[key] = needCom;
                                continue;
                            }
                            else { Editor.warn(`${key}没有对应的组件`); }
                        }
                        else { Editor.warn(`${key}没有此节点`); }
                    }
                }
                Editor.log("自动绑定成功^—^");
            }
        }
        if (!findCustomCom) {
            Editor.warn("没找到自定义脚本");
        }
    }
    function cacheChildren(p) { ChildrenMap = new Map(); _cacheChildren(p, ChildrenMap); }
    function _cacheChildren(p, cMap) { var _a; let children = p.children; for (let i = 0; i < children.length; i++) { let child = children[i]; cMap.get(child.name) || (cMap.set(child.name, [])); (_a = cMap.get(child.name)) === null || _a === void 0 ? void 0 : _a.push(child); if (child.childrenCount > 0 && !child.getComponent("AutoBinderBase")) { _cacheChildren(child, cMap); } } }
})(scene || (scene = {})); module.exports = scene;