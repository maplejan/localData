/**
 * LocalData v0.3.1
 * 一个结构化localStorage数据的简易操作库
 * Author: Maple Jan
 * E-mail: jiancm2001@gmail.com
 * Date: 13-3-13
 */

(function(w) {
    /**
     * @class LocalData
     */
    function LocalData(config) {
        var _self = this;

        var debug = function(isDebug) {
            return isDebug ? function(command, str) { console[command]("[LocalData]: " + str); } : function () {};
        }(true);

        function each(arr, callback) {
            for(var i = 0, len = arr.length; i < len; i++) {
                callback(arr[i], i);
            }
        }

        function extend(target){
            [].slice.call(arguments, 1).forEach(function(source) {
                for (key in source) {
                    source[key] !== undefined && (target[key] = source[key]);
                }
            });
            return target;
        }

        extend(_self, {

            /**
             * 用于存储复杂的表名
             * @type Object
             */
            item: {},

            /**
             * 创健一个localStorage的item
             * create(table[, dataObj])
             * @param {String} table 表名
             * @returns {Boolean}
             */
            create: function(table) {
                if(localStorage[table] !== undefined && !localStorage[table].length) {
                    debug("warn", "localStorage[\"" + table + "\"] 已存在");
                    return false;
                }
                if(arguments[1]) {
                    localStorage[table] = JSON.stringify(arguments[1]);
                } else {
                    localStorage[table] = "[]";
                }
                return true;
            },

            /**
             * 查找localStorage中指定item的匹配属性
             * select(table, selector)
             * @param {String} table 表名
             * @param selector 选择器
             */
            select: function(table, selector) {

                var data = localStorage[table];

                if(data === undefined || !data.length) {
                    debug("warn", "localStorage[\"" + table + "\"] 未定义,或为空");
                    return data;
                }

                data = JSON.parse(data);

                var result = [[], []]; // result[0]为item数据, result[1]为对应item数据列表中的位置

                if(selector === "*" || selector === undefined) {
                    result[0] = data;
                    each(data, function(val, key) {
                        result[1].push(key);
                    });
                }
                // selector为Number类型
                else if(typeof selector === "number") {
                    result[0].push(data[selector]);
                    result[1].push(selector);
                }
                // selector为Array类型
                else if(selector instanceof Array) {
                    each(selector, function(val, key) {
                        result[0].push(data[val]);
                        result[1].push(val);
                    });
                }
                // selector为String类型
                else if(typeof selector === "string") {
                    var selectorArr = selector.split(","),
                        index = "",
                        value = "",
                        arr1 = [],
                        arr2 = [];

                    for(var i = 0, len = selectorArr.length; i < len; i++) {
                        var val = selectorArr[i],
                            key = i;
                        if(!val.match(/\S+=\S+/)) {
                            debug("warn", "选择器\"" + selector + "\" 错误");
                            break;
                        }
                        index = val.split("=")[0];
                        value = val.split("=")[1];
                        if(key == 0) {
                            each(data, function(val, key) {
                                if(val[index] == value) {
                                    arr1.push(key);
                                }
                            });
                            //for(var j = 0, l = )
                        } else {
                            each(arr1, function(val, key) {
                                if(data[val][index] == value) {
                                    arr2.push(val);
                                }
                            });
                            arr1 = arr2;
                            arr2 = [];
                        }
                    }

                    each(arr1, function(val, key) {
                        result[0].push(data[val]);
                    })
                    result[1] = arr1;
                }
                return result;
            },

            /**
             * 删除localStorage中指定item的匹配属性
             * remove(table, selector)
             * @param {String} table 表名
             * @param selector 选择器
             * @returns {Boolean}
             */
            remove: function(table, selector) {
                var data = _self.select(table, selector);

                // localStorage不存在该item
                if(data === undefined) {
                    return false;
                }
                // localStorage存在该条item，但其为空
                else if(!data.length || selector === "*" || selector === undefined) {
                    localStorage.removeItem(table);
                }
                else {
                    var arr = [];
                    // selector为Number类型
                    if(typeof selector === "number") {
                        arr.push(selector);
                    }
                    // selector为Array类型
                    else if(selector instanceof Array) {
                        arr = selector;
                    }
                    // selector为String类型
                    else if(typeof selector === "string") {
                        arr = data[1];
                    }
                    data = _self.select(table)[0];
                    each(arr, function(val, key){
                        var num = val - key;
                        data.splice(num, 1);
                    });
                    localStorage[table] = JSON.stringify(data);
                }
                return true;
            },

            /**
             * 向localStorage中指定的item插入数据
             * insert(table, obj)
             * @param {String} table 表名
             * @param obj 更新数据
             * @returns {Boolean}
             */
            insert: function(table, obj) {
                var data = _self.select(table);
                if(data === undefined) {
                    return false;
                }
                if(obj.push) {
                    each(obj, function(val, key) {
                        data[0].push(val);
                    });
                } else {
                    data[0].push(obj);
                }
                localStorage[table] = JSON.stringify(data[0]);
                return true;
            },

            /**
             * 更新localStorage中指定的item中的指定数据
             * update(table, selector, obj)
             * @param {String} table 表名
             * @param selector 选择器
             * @param obj 更新数据
             * @returns {Boolean}
             */
            update: function(table, selector, obj) {
                var data = JSON.parse(localStorage[table]),
                    result = _self.select(table, selector);
                if(result[1].length > 1) {
                    debug("error", "匹配结果大于1");
                    return false;
                }
                var key = result[1][0];
                // obj为String类型
                if(typeof obj === "string") {
                    var arr = obj.split(","),
                        index = "",
                        value = "";
                    for(var i = 0; i < arr.length; i++) {
                        index = arr[i].split("=")[0];
                        value = arr[i].split("=")[1];
                        data[key][index] = value;
                    }
                }
                // obj为Object类型
                else if(obj.constructor === Object) {
                    extend(data[key], obj);
                }
                else {
                    debug("error", "插入参数格式不符");
                    return false;
                }

                localStorage[table] = JSON.stringify(data);
                return true;
            }

        });

        (function init(config) {
            extend(_self.item, config);
        })(config);
    }

    w.LocalData = LocalData;

})(window);