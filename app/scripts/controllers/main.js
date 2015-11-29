'use strict';

angular.module('jsonschemaV4App').factory('RecursionHelper',
    ['$compile','Schemaservice',
    function($compile, Schemaservice) {
         var RecursionHelper = {
            // The compile function for the directive which returns the link
            // function.
            compile: function(tElement, tAttrs) {

                var contents = tElement.contents().remove();
                var compiledContents;

                // postLink function.
                return {
                    post: function(scope, iElement, iAttrs) {

                        if (!compiledContents) {
                            /*
                            Note: The compile function cannot handle directives that
                            recursively use themselves in their own templates or
                            compile functions. Compiling these directives results in
                            an infinite loop and a stack overflow errors. This can be
                            avoided by manually using $compile in the postLink function
                            to imperatively compile a directive's template instead of
                            relying on automatic template compilation via template or
                            templateUrl declaration or manual compilation inside the
                            compile function.
                            */
                            compiledContents = $compile(contents);
                            /*
                            $compile() compiles an HTML string or DOM into a template
                            and produces a template function, which can then be used
                            to link scope and the template together.
                            */
                        }

                        // Link scope and the template together.
                        compiledContents(scope, function(clone) {
                            iElement.append(clone);
                        });


                        scope.UserDefinedOptions = UserDefinedOptions;

                        scope.deleteMe = function(id) {
                            iElement.remove();
                            Schemaservice.removeSchema(id);
                        };
                    },
                    pre: function(scope, iElement, iAttrs) { }
                }
            }
        }
        return RecursionHelper;
    }
]);

angular.module('jsonschemaV4App').directive("schema", function(RecursionHelper) {
    return {
        restrict: "E",
        scope: {
            data: '=data'
        },
        templateUrl: 'views/schema.html',
        compile: function(tElement, tAttributes) {
            return RecursionHelper.compile(tElement, tAttributes);
        }
    };
});


angular.module('jsonschemaV4App')
    .controller('InputController', ['$scope', '$log', '$rootScope',
        'Schemaservice',
        function($scope, $log, $rootScope, Schemaservice) {

            $scope.validateJSON = function() {
                $scope.inputError = !Schemaservice.isValidJSON($scope.json);
            };


            $scope.schemarize = function() {

                if (!Schemaservice.isValidJSON($scope.json)) {
                    return;
                }
                // Update app options in case the user defined new values.
                UserDefinedOptions.url = $scope.url;
                UserDefinedOptions.json = $scope.json;
                UserDefinedOptions.includeDefaults = $scope.includeDefaults;
                UserDefinedOptions.includeEnums = $scope.includeEnums;
                UserDefinedOptions.forceRequired = $scope.forceRequired;
                UserDefinedOptions.emptySchemas = $scope.emptySchemas;
                UserDefinedOptions.arrayOptions = $scope.arrayOptions;
                UserDefinedOptions.absoluteIds = $scope.absoluteIds;
                UserDefinedOptions.numericVerbose = $scope.numericVerbose;
                UserDefinedOptions.stringsVerbose = $scope.stringsVerbose;
                UserDefinedOptions.objectsVerbose = $scope.objectsVerbose;
                UserDefinedOptions.arraysVerbose = $scope.arraysVerbose;
                UserDefinedOptions.metadataKeywords = $scope.metadataKeywords;
                UserDefinedOptions.numericVerbose = $scope.numericVerbose;
                UserDefinedOptions.additionalItems = $scope.additionalItems;
                UserDefinedOptions.additionalProperties = $scope.additionalProperties;

                // Generate basic schema structure.
                Schemaservice.JSON2Schema();

                $scope.json = Schemaservice.getFormattedJSON();
                $rootScope.$broadcast('E_SchemaUpdated');
            };

            $scope.reset = function() {

                UserDefinedOptions = angular.copy(defaultOptions);

                $scope.inputError = false;
                //
                $scope.url = defaultOptions.url;
                $scope.json = angular.toJson(defaultOptions.json, true);
                $scope.includeDefaults = defaultOptions.includeDefaults;
                $scope.includeEnums = defaultOptions.includeEnums;
                $scope.forceRequired = defaultOptions.forceRequired;
                $scope.emptySchemas = defaultOptions.emptySchemas;
                $scope.arrayOptions = defaultOptions.arrayOptions;
                $scope.absoluteIds = defaultOptions.absoluteIds;
                $scope.numericVerbose = defaultOptions.numericVerbose;
                $scope.stringsVerbose = defaultOptions.stringsVerbose;
                $scope.objectsVerbose = defaultOptions.objectsVerbose;
                $scope.arraysVerbose = defaultOptions.arraysVerbose;
                $scope.metadataKeywords = defaultOptions.metadataKeywords;
                $scope.numericVerbose = defaultOptions.numericVerbose;
                $scope.additionalItems = defaultOptions.additionalItems;
                $scope.additionalProperties = defaultOptions.additionalProperties;
            }

            $scope.init = function() {
                $scope.reset();
                $scope.schemarize();
            }

            // Loads UI defaults and generates schema as soon as HTML
            // code finds <div class="col-md-6" ng-controller="InputController">.
            // Therefore schema is generated before OutputController and any
            // children are initialized.
            $scope.init();
        }
    ]);

angular.module('jsonschemaV4App')
    .controller('EditController', ['$scope', '$log', '$rootScope',
        'Schemaservice',
        function($scope, $log, $rootScope, Schemaservice) {

            $scope.init = function() {
                $scope.data = Schemaservice.getEditableSchema();
            }

            // $scope.$on('E_SchemaUpdated', function (event, data) {
            //     $log.debug('E_SchemaUpdated');
            //     $scope.init();
            // });

            $scope.init();
        }
    ]);

angular.module('jsonschemaV4App')
    .controller('CodeController', ['$scope', '$log',
        'Schemaservice',
        function($scope, $log, Schemaservice) {

            $scope.init = function() {
                $scope.data = Schemaservice.getSchemaAsString(
                                true);
            }

            // $scope.$on('E_SchemaUpdated', function (event, data) {
            //     $log.debug('E_SchemaUpdated');
            //     $scope.init();
            // });

            $scope.init();
        }
    ]);

angular.module('jsonschemaV4App')
    .controller('StringController', ['$scope', '$log',
        'Schemaservice',
        function($scope, $log, Schemaservice) {

            $scope.init = function() {
                $scope.data = Schemaservice.getSchemaAsString(
                                false);
            }

            // $scope.$on('E_SchemaUpdated', function (event, data) {
            //     $log.debug('E_SchemaUpdated');
            //     $scope.init();
            // });

            $scope.init();
        }
    ]);

angular.module('jsonschemaV4App')
    .controller('OutputController', ['$scope', '$rootScope', '$log',
        '$location', '$anchorScroll',
        'Schemaservice', 'Version',
        function($scope, $rootScope, $log, $location, $anchorScroll, Schemaservice, Version) {

            $scope.gotoTop = function() {
                $location.hash('top');
                $anchorScroll();
            };

            $scope.setEditView = function() {
                // Change view.
                $scope.data = Schemaservice.getSchemaAsString(
                                false);
                $scope.editSchema = true;

                $scope.stringSchema = false;
                $scope.codeSchema = false;
            };

            $scope.setStringView = function() {
                // Change view.
                $scope.data = Schemaservice.getSchemaAsString(
                                false);
                $scope.stringSchema = true;

                $scope.editSchema = false;
                $scope.codeSchema = false;
            };

            $scope.setCodeView = function() {
                // The user may have come from Edit View so assume schema
                // has changed.
                // $rootScope.$broadcast('E_SchemaUpdated');
                // Change view.
                $scope.data = Schemaservice.getSchemaAsString(
                                false);
                $log.debug($scope.data);
                $scope.codeSchema = true;

                $scope.editSchema = false;
                $scope.stringSchema = false;

                $scope.$digest();
            };

            $scope.init = function() {
                $scope.setCodeView();
            }

            $scope.init();
        }
    ]);
