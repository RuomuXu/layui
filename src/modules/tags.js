
layui.define(['jquery'], function (exports) {
    "use strict";

    var $ = layui.jquery;

    // 默认配置
    var defaultConfig = {
        tagData: [],         // 初始 tag 数据
        maxTags: Infinity,  // 最大可选 tag 数量
        styles: {           // 样式配置
            tagBgColor: '#FF5722',
            tagTextColor: '#FFFFFF',
            tagFontSize: '14px'
        },
        onTagAdd: null,     // 添加 tag 回调
        onTagRemove: null   // 删除 tag 回调
    };

    var Tags = function (config) {
        this.config = $.extend(true, {}, defaultConfig, config);
        this.selectedTags = [];
        this.selectedSuggestionIndex = -1; // 新增
        this.init();
    };


    // 初始化
    Tags.prototype.init = function () {
        var self = this;
        var container = $(self.config.elem); // 容器

        // 输入框 HTML
        container.addClass('layui-tags-container').html(`
            <div class="layui-tags">
                <input type="text" name="${self.config.elem.substring(1)}" class="layui-tags-input layui-input" placeholder="Search Tag or New Tag" />
                <div class="layui-tags-selected"></div>
                <ul class="layui-tags-suggestions"></ul>
            </div>
        `);

        self.input = container.find('.layui-tags-input');
        self.selectedContainer = container.find('.layui-tags-selected');
        self.suggestionList = container.find('.layui-tags-suggestions');

        // 渲染初始 tag
        // self.renderInitialTags();

        // 绑定事件
        self.bindEvents();
    };

    // 渲染初始标签
    Tags.prototype.renderInitialTags = function () {
        var self = this;
        self.config.tagData.forEach(tag => {
            self.addTag(tag, true);
        });
    };

    // 添加 tag
    Tags.prototype.addTag = function (tag, isInit) {
        var self = this;
        if (self.selectedTags.length >= self.config.maxTags) {
            layer.msg('This tag limit is reached, the max ' + self.config.maxTags + ' tags can be selected.', {icon: 0});
            return;
        }

        if (!self.selectedTags.includes(tag)) {
            self.selectedTags.push(tag);
            var tagElem = $(`
                <span class="layui-tag">
                    ${tag} <i class="layui-icon layui-icon-close"></i>
                </span>
            `);
            tagElem.find('.layui-icon-close').on('click', function () {
                self.removeTag(tag);
            });

            self.selectedContainer.append(tagElem);

            if (!isInit && typeof self.config.onTagAdd === 'function') {
                self.config.onTagAdd(tag);
            }
        }
    };

    // 删除 tag
    Tags.prototype.removeTag = function (tag) {
        var self = this;
        self.selectedTags = self.selectedTags.filter(t => t !== tag);
        self.selectedContainer.find(`.layui-tag:contains('${tag}')`).remove();

        if (typeof self.config.onTagRemove === 'function') {
            self.config.onTagRemove(tag);
        }
    };

    // 绑定事件
    Tags.prototype.bindEvents = function () {
        var self = this;

        // 输入事件
        self.input.on('input', function () {
            var query = $(this).val().trim();
            if (query) {
                self.showSuggestions(query);
            } else {
                self.suggestionList.empty().hide();
            }
        });

        // 回车事件
        self.input.on('keydown', function (e) {
            if (e.which === 13) { // 回车键
                var query = $(this).val().trim();
                if (self.selectedSuggestionIndex !== -1) {
                    // 如果有选中的建议，添加选中的建议
                    var selectedSuggestion = self.suggestionList.find('li').eq(self.selectedSuggestionIndex).text();
                    self.addTag(selectedSuggestion);
                    self.selectedSuggestionIndex = -1; // 重置选中的建议索引
                } else if (query) {
                    // 如果没有选中的建议，但输入框有内容，添加输入框的内容
                    var match = self.config.tagData.find(tag => tag.toLowerCase() === query.toLowerCase());
                    if (match) {
                        self.addTag(match);
                    } else {
                        self.addTag(query);
                    }
                }
                $(this).val('');
                self.suggestionList.empty().hide();
                e.preventDefault();
            } else if (e.which === 38) { // 上键
                e.preventDefault(); // 阻止默认行为
                if (self.selectedSuggestionIndex > 0) {
                    self.selectedSuggestionIndex--;
                } else {
                    self.selectedSuggestionIndex = self.suggestionList.find('li').length - 1;
                }
                self.updateSuggestionHighlight();
            } else if (e.which === 40) { // 下键
                e.preventDefault(); // 阻止默认行为
                if (self.selectedSuggestionIndex < self.suggestionList.find('li').length - 1) {
                    self.selectedSuggestionIndex++;
                } else {
                    self.selectedSuggestionIndex = 0;
                }
                self.updateSuggestionHighlight();
            } else if (e.which === 9) { // Tab 键
                e.preventDefault(); // 阻止默认行为
                var firstSuggestion = self.suggestionList.find('li').first().text();
                if (firstSuggestion) {
                    self.addTag(firstSuggestion);
                    $(this).val('');
                    self.suggestionList.empty().hide();
                }
            }
        });


        // 新增方法：更新建议项的高亮显示
        Tags.prototype.updateSuggestionHighlight = function () {
            var self = this;
            self.suggestionList.find('li').removeClass('highlight').eq(self.selectedSuggestionIndex).addClass('highlight');
        };


        // 选择建议事件
        self.suggestionList.on('click', 'li', function () {
            var tag = $(this).text();
            self.addTag(tag);
            self.input.val('');
            self.suggestionList.empty().hide();
        }).on('mouseenter', 'li', function () {
            self.suggestionList.find('li').removeClass('highlight');
            $(this).addClass('highlight');
        });

        // 聚焦/失焦事件
        self.input.on('focus', function () {
            var query = $(this).val().trim();
            if (query) {
                self.showSuggestions(query);
            }
        }).on('blur', function () {
            // setTimeout(function () {
            //     self.suggestionList.hide();
            // }, 200);
        });
    };

    // 显示建议
    Tags.prototype.showSuggestions = function (query) {
        var self = this;
        var suggestions = self.config.tagData.filter(tag =>
            tag.toLowerCase().includes(query.toLowerCase()) && !self.selectedTags.includes(tag)
        );

        self.selectedSuggestionIndex = -1; // 初始化

        if (suggestions.length) {
            self.suggestionList.html(
                suggestions.map(tag => `<li>${tag}</li>`).join('')
            ).show();
        } else {
            self.suggestionList.empty().hide();
        }
    };


    // 注册模块
    exports('tags', {
        render: function (config) {
            return new Tags(config);
        }
    });
});