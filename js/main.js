"use strict";
///<reference path="../editor/editor-assetDB.d.ts"/>
///<reference path="../editor/editor-main.d.ts"/>
///<reference path="../editor/editor-renderer.d.ts"/>
///<reference path="../editor/editor-scene.d.ts"/>
///<reference path="../editor/editor-share.d.ts"/>
///<reference path="../editor/engine.d.ts"/>
///<reference path="../editor/fs.d.ts"/>
///<reference path="../editor/creator.d.ts"/>
///<reference path="./tool/log.ts"/>
//@ts-ignore
const Log = require("./tool/log");
var Main;
(function (Main) {
    function load() {
        // execute when package loaded 
        // Editor.log("=========脚本加载")
        // Electron.ipcMain.on('selection:selected', (evet, ss)=> {
        //   Editor.log("==============选中改变===")
        // })
    }
    Main.load = load;
    function unload() {
        // execute when package unloaded
    }
    Main.unload = unload;
    function onBinderNode(funName) {
        let activeInfo = Editor.Selection.curGlobalActivate();
        if (activeInfo) {
            // Editor.log("============", activeInfo.type);
            let node_uids = Editor.Selection.curSelection("node");
            // node = cc.Canavas.instance;
            //Editor.log(node_uids, node_uids.length);
            // 获取脚本
            // let srcs = node.getComponents(cc.Component);
            // Editor.log(srcs.length);
            for (let i = 0; i < node_uids.length; i++) {
                let id = node_uids[i];
                Editor.Scene.callSceneScript("node-binder", funName, id);
            }
        }
    }
    // register your ipc messages here
    Main.messages = {
        binderNode() {
            onBinderNode("binder_nodes");
        },
        autoGenCode() {
            onBinderNode("auto_gen_code");
        },
        // 'say-hello' () {
        //   Editor.log('Hello World!');
        //   // send ipc message to panel
        //   Editor.Ipc.sendToPanel('node-auto_binder', 'node-auto_binder:hello');
        // },
    };
})(Main || (Main = {}));
;
module.exports = Main;
