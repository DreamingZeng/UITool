"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unload = exports.load = exports.methods = void 0;
/**
 * @en Registration method for the main process of Extension
 * @zh 为扩展的主进程的注册方法
 */
exports.methods = {
    binderNode() {
        callSceneFunc("binder_nodes");
    },
    autoGenCode() {
        callSceneFunc("auto_gen_code");
    },
    autoGenCodeAndBinder() {
        callSceneFunc("auto_gen_code_and_binder");
    },
    printMappingRules() {
        callSceneFunc("print_mapping_rules");
    },
};
/**
 * @en Hooks triggered after extension loading is complete
 * @zh 扩展加载完成后触发的钩子
 */
function load() {
    // console.log('main load');
}
exports.load = load;
/**
 * @en Hooks triggered after extension uninstallation is complete
 * @zh 扩展卸载完成后触发的钩子
 */
function unload() {
    // console.log('main unload');
}
exports.unload = unload;
async function callSceneFunc(funName) {
    let node_uids = Editor.Selection.getSelected("node");
    // console.log('main onBinderNode',node_uids);
    if (node_uids.length) {
        let id = node_uids[0];
        const options = {
            name: 'ui_tool',
            method: funName,
            args: [id],
        };
        Editor.Message.request('scene', 'execute-scene-script', options);
    }
}
