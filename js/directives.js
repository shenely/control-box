angular.module("controlBox.directives", [])
  .directive("controlBox", function () {
    return {
      restrict: "E",
      scope: true,
      controller: ControlBoxController
    };
  })
