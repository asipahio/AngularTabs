angular.module('AngularTabs', [])
.directive('dropdowntabs', ['$rootScope', '$routeParams', '$timeout', '$location', function ($rootScope, $routeParams, $timeout, $location) {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        controller:['$scope', function (scope) {
            scope.templateUrl = '';
            scope.defaultTemplateUrl = '';
            scope.tabsName = "";
            var tabs = scope.tabs = [];
            var controller = this;

            controller.selectTab = function (mainTab) {
                angular.forEach(tabs, function (tab) {
                    tab.selected = false;
                    if (tab != mainTab) {
                        angular.forEach(tab.subtabs, function (subtab) {
                            subtab.selected = false;
                        });
                    }
                });

                mainTab.selected = true;
            };

            scope.selectFromBreadcrumb = function (tabToLoad) {
                $location.search("TabName", tabToLoad);
            }

            controller.setTabTemplate = function (templateUrl, childData, title) {
                if (scope.templateUrl != templateUrl || $rootScope.childData != childData) {
                    scope.templateUrl = templateUrl + "?" + Date.now();
                    $rootScope.childData = childData;
                    $rootScope.loadingTab = true;
                    localStorage.setItem('lastTab' + scope.tabsName, title);
                }
            }

            controller.setBreadcrumb = function (tab, subtab, dynTab) {
                scope.tab = tab;
                scope.subtab = subtab;
                scope.dynTab = dynTab;
            }

            controller.addTab = function (tab) {
                if (tabs.length == 0) {
                    controller.selectTab(tab);
                }
                tabs.push(tab);
            };

            controller.tabsName = function () { return scope.tabsName; }
        }],
        link: function (scope, element, attrs, tabsetController) {
            var lastTab = localStorage.getItem('lastTab' + attrs.tabsName);
            if ($routeParams.TabName) { lastTab = $routeParams.TabName; }
            if (!lastTab) { lastTab = attrs.defaultTab; }
            var selectedTab = false; var defaultTab, defaultSubTab = "";
            var isFoundDefaultTab = false;
            if (lastTab) {
                angular.forEach(scope.tabs, function (tab) {
                    if (tab.title == lastTab && tab.isHiddenTab != "true") {
                        $timeout(function () { tabsetController.setTabTemplate(tab.templateUrl, tab.childData, tab.title) }, 1000);
                        tabsetController.selectTab(tab);
                        tabsetController.setBreadcrumb(tab.title, tab.title);
                        selectedTab = true;
                    }
                    if (tab.isHiddenTab != "true") {
                        angular.forEach(tab.subtabs, function (subtab) {
                            if (subtab.title == lastTab && !subtab.isDisabled && subtab.isShowTab) {
                                $timeout(function () { tabsetController.setTabTemplate(subtab.templateUrl, subtab.childData, subtab.title) }, 1000);
                                tabsetController.selectTab(tab);
                                tabsetController.setBreadcrumb(tab.title, subtab.title);
                                selectedTab = true;
                            }
                            if (subtab.title == attrs.defaultTab) {
                                defaultSubTab = subtab;
                                defaultTab = tab;
                                isFoundDefaultTab = true;
                            }
                        });
                    }
                });
            }
            if (!selectedTab && defaultTab != undefined && defaultTab.isHiddenTab != "true") {
                selectedTab = true;
                $location.search("TabName", defaultSubTab.title);
            } else if (!selectedTab) {
                selectedTab = true;
                var firstAvailableTab = _.where(scope.tabs, { 'isHiddenTab': undefined })[0];
                var tabTitle = firstAvailableTab.title;
                if (firstAvailableTab.subtabs != undefined) {
                    tabTitle = firstAvailableTab.subtabs[0].title;
                }
                $location.search("TabName", tabTitle);
            }
            scope.tabsName = attrs.tabsName;
        },
        template:
          '<div class="row-fluid">' +
            '<div class="row-fluid">' +
                '<ul class="nav nav-tabs" ng-transclude></ul>' +
            '</div>' +
            '<div class="breadrumb">' +
                '<ol class="breadcrumb">' +
                    '<li>{{tab}}</li>' +
                    '<li data-ng-class="{active:!dynTab}" data-ng-show="subtab"><a  data-ng-click="selectFromBreadcrumb(subtab)">{{subtab}}</a></li>' +
                    '<li class="active" data-ng-show="dynTab">{{dynTab}}</li>' +
                    '<li data-ng-show="loadingTab">Loading <i class="fa fa-spinner fa-spin"></i></li>' +
                '</ol>' +
            '</div>' +
            '<div class="row-fluid tabContent">' +
                '<ng-include src="templateUrl"></ng-include>' +
            '</div>' +
          '</div>'
    };
}])
.directive('singletab', ['$routeParams', '$location', function ($routeParams, $location) {
    return {
        restrict: 'E',
        replace: true,
        require: '^dropdowntabs',
        transclude: true,
        scope: {
            title: '@',
            successTab: '@',
            dangerTab: '@',
            templateUrl: '@',
            childData: '@'
        },
        controller: ['$scope', function (scope) {
        }],
        link: function (scope, element, attrs, tabsetController) {
            scope.isHiddenTab = attrs.ngHide;
            tabsetController.addTab(scope);

            scope.select = function () {
                if (scope.title != $routeParams.TabName) {
                    $location.search("TabName", scope.title);
                }
            }

            scope.selectTab = function () {
                tabsetController.setTabTemplate(scope.templateUrl, scope.childData, scope.title);
                tabsetController.setBreadcrumb(scope.title);
            }

            scope.$on('$routeUpdate', function () {
                if (scope.title == $routeParams.TabName) {
                    if (!scope.selected) {
                        scope.selected = true;
                        scope.selectTab();
                    }
                } else {
                    scope.selected = false;
                }
            });
        },
        template:
          '<li ng-class="{active: selected, success: successTab == \'true\', danger: dangerTab == \'true\'}">' +
            '<a ng-click="select()">{{ title }}</a>' +
          '</li>'
    };
}])
.directive('dropdowntab', ['$routeParams', function ($routeParams) {
    return {
        restrict: 'E',
        replace: true,
        require: '^dropdowntabs',
        transclude: true,
        scope: {
            title: '@'
        },
        controller: ['$scope', function (scope) {
            scope.templateUrl = '';
            var subtabs = scope.subtabs = [];
            var controller = this;

            this.addSubTab = function (tab) {
                if (subtabs.length == 0) {
                    controller.selectTab(tab);
                }
                subtabs.push(tab);
            };

            this.selectTab = function (tab) {
                angular.forEach(subtabs, function (tab) {
                    tab.selected = false;
                    angular.forEach(tab.tabs, function (subtab) {
                        subtab.selected = false;
                    });
                });
                tab.selected = true;
            };
        }],
        link: function (scope, element, attrs, tabsetController) {
            scope.isHiddenTab = attrs.ngHide;
            tabsetController.addTab(scope);

            scope.select = function () {
                tabsetController.selectTab(scope);
                for (i = 0; i < scope.subtabs.length; i++) {
                    if (scope.subtabs[i].selected) {
                        tabsetController.setTabTemplate(scope.subtabs[i].templateUrl, scope.subtabs[i].childData, scope.subtabs[i].title);
                        tabsetController.setBreadcrumb(scope.title, scope.subtabs[i].title);
                    }
                    angular.forEach(scope.subtabs[i].tabs, function (tab) {
                        if (tab.selected) {
                            tabsetController.setTabTemplate(tab.templateUrl, tab.childData, scope.subtabs[i].title);
                            tabsetController.setBreadcrumb(scope.title, scope.subtabs[i].title, tab.title);
                        }
                    });
                }
            }

            scope.$on('$routeUpdate', function () {
                angular.forEach(scope.subtabs, function (tab) {
                    tab.selected = false;
                    angular.forEach(tab.tabs, function (subtab) {
                        subtab.selected = false;
                    });
                });
                var didMarkTabSelected = false;
                angular.forEach(scope.subtabs, function (tab) {
                    if (tab.title == $routeParams.TabName) {
                        if (!tab.selected) {
                            tab.selected = true;
                            scope.selected = true;
                            didMarkTabSelected = true;
                            scope.select();
                        }
                    } else {
                        tab.selected = false;
                        if (!didMarkTabSelected) {
                            scope.selected = false;
                        }
                    }
                    angular.forEach(tab.tabs, function (subtab) {
                        if (subtab.title == $routeParams.TabName) {
                            if (!subtab.selected) {
                                subtab.selected = true;
                                scope.select();
                            }
                        } else {
                            subtab.selected = false;
                        }
                    });
                });
                didMarkTabSelected = false;
            });
        },
        template:
          '<li ng-class="{active: selected}" class="dropdown">' +
            '<a class="dropdown-toggle" data-toggle="dropdown">{{ title }} <span class="caret"></span></a>' +
            '<ul class="dropdown-menu" ng-transclude></ul>' +
          '</li>'
    };
}])
.directive('sub', ['$compile', '$rootScope', '$location', '$http', function ($compile, $rootScope, $location, $http) {
    var dynamicTabsTemplate =
        '<li ng-class="{active: selected, disabled: isDisabled, success: successTab == \'true\', danger: dangerTab == \'true\', \'dropdown-submenu\': tabs.length > 0}" data-ng-show="{{isShowTab}}">' +
            '<a href="" ng-click="select(isDisabled)">{{ title }}</a>' +
            '<ul class="dropdown-menu" data-ng-show="tabs.length > 0">' +
                '<li data-ng-repeat="tab in tabs">' +
                    '<a ng-click="selectSubTab()">{{ tab.title }}</a>' +
                '</li>' + 
            '</ul>' +
        '</li>';
    var tabsTemplate =
        '<li ng-class="{active: selected, disabled: isDisabled, success: successTab == \'true\', danger: dangerTab == \'true\'}" data-ng-show="{{isShowTab}}">' +
            '<a href="" ng-click="select(isDisabled)">{{ title }}</a>' +
        '</li>';

    return {
        restrict: 'E',
        replace: true,
        require: '^dropdowntab',
        scope: {
            title: '@',
            templateUrl: '@',
            childData: '@',
            role: '@',
            successTab: '@',
            dangerTab: '@',
            isDynamicTabs: '@',
            isShowTab: '@',
            ngHide: '@'
        },
        link: function (scope, element, attrs, tabController) {
            tabController.addSubTab(scope);

            if (scope.ngHide == "true") {
                scope.isShowTab = "false";
            }

            scope.select = function (tabDisabled) {
                if (!tabDisabled && scope.isShowTab != "false") {
                    tabController.selectTab(scope);
                    $location.search("TabName", scope.title);
                }
            }
            scope.selectSubTab = function () {
                tabController.selectTab(this.tab);
                $location.search("TabName", this.tab.title);
            }

            switch (scope.isShowTab) {
                case "true":
                    scope.isShowTab = true;
                    break;
                case "false":
                    scope.isShowTab = false;
                    break;
                default:
                    scope.isShowTab = true;
                    break;
            }

            if (scope.role) {
                if ($rootScope.User.UserRoles.indexOf(scope.role) == -1) {
                    scope.isDisabled = true;
                }
            }
            if (attrs.dynamicTabs && attrs.loadDynamicTabs == "true") {
                element.html(dynamicTabsTemplate);
                $http.post(attrs.dynamicTabs, scope.childData).success(function (data) {
                    if (data.tabs.length == 0) {
                        scope.isDynamicTabs = false;
                    } else {
                        scope.isDynamicTabs = true;
                        scope.tabs = data.tabs;
                    }
                });
            } else {
                element.html(tabsTemplate);
            }
            var e = $compile(element.contents())(scope);
            element.replaceWith(e);
        }
    };
}]);