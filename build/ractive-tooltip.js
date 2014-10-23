(function() {
  var __slice = [].slice,
    __hasProp = {}.hasOwnProperty;

  (function(root) {
    var Ractive, TooltipDecorator, camelCase, createTooltipView, error, extend, getStyle, prefixCache, setStyle, styleProp, template, testStyle, vendors;
    Ractive = root.Ractive;
    if (typeof Ractive === 'undefined') {
      error = "Please install Ractive [http://www.ractivejs.org/]";
      console.error(error);
      return;
    }
    extend = function() {
      var prop, source, sources, target;
      target = arguments[0], sources = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      while (source = sources.shift()) {
        for (prop in source) {
          if (!__hasProp.call(source, prop)) continue;
          target[prop] = source[prop];
        }
      }
      return target;
    };
    testStyle = document.createElement('div').style;
    vendors = ['moz', 'webkit', 'o', 'ms'];
    prefixCache = {};
    styleProp = function(prop) {
      var capped, i, vendor;
      prop = camelCase(prop);
      if (!prefixCache[prop]) {
        if (typeof testStyle[prop] !== 'undefined') {
          prefixCache[prop] = prop;
        } else {
          capped = prop.charAt(0).toUpperCase() + prop.substring(1);
          i = venders.length;
          while (i--) {
            vendor = vendors[i];
            if (typeof testStyle[vendor + capped] !== 'undefined') {
              prefixCache[prop] = vendor + capped;
              break;
            }
          }
        }
      }
      return prefixCache[prop];
    };
    camelCase = function(hyphenatedStr) {
      return hyphenatedStr.replace(/-([a-zA-Z])/g, function(match, $1) {
        return $1.toUpperCase();
      });
    };
    getStyle = function(node, style) {
      var prop, props, value;
      props = window.getComputedStyle(node);
      prop = styleProp(style);
      value = props.getPropertyValue(prop) || props[prop];
      if (value === '0px') {
        value = 0;
      }
      return value;
    };
    setStyle = function(node, style, value) {
      node.style[styleProp(style)] = value;
      return node;
    };
    createTooltipView = function(targetNode, options) {
      var createRect;
      createRect = function() {
        var args, isBody, node, r, rect;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        r = {
          top: 0,
          left: 0,
          height: 0,
          width: 0,
          bottom: 0,
          right: 0,
          _isRect: true
        };
        if (args.length < 3) {
          if (args[0]._isRect) {
            r = args[0].r;
          } else {
            node = typeof args[0] === 'string' ? document.querySelector(args[0]) : args[0];
            rect = node.getBoundingClientRect();
            isBody = node.tagName === 'BODY';
            r.marginTop = parseFloat(getStyle(node, 'margin-top')) || 0;
            r.marginLeft = parseFloat(getStyle(node, 'margin-left')) || 0;
            r.top = rect.top;
            r.left = rect.left;
            if (!args[1]) {
              r.top -= r.marginTop;
              r.left -= r.marginLeft;
            }
            r.scroll = isBody ? document.documentElement.scrollTop || document.body.scrollTop : node.scrollTop;
            r.height = isBody ? window.innerHeight || document.documentElement.clientHeight : node.offsetHeight;
            r.width = isBody ? window.innerWidth || document.documentElement.clientWidth : node.offsetWidth;
          }
        } else {
          r.top = args[0], r.left = args[1], r.height = args[2], r.width = args[3];
        }
        r.right = r.left + r.width;
        r.bottom = r.top + r.height;
        return r;
      };
      return new Ractive({
        el: options.viewport,
        debug: options.debug,
        append: true,
        template: options.template,
        computed: {
          arrowPositionLeft: "Math.round(50 - ((${viewportOffsetDelta.left} / ${tooltipRect.width}) * 100))",
          arrowPositionTop: "Math.round(50 - ((${viewportOffsetDelta.top} / ${tooltipRect.height}) * 100))",
          arrowStyle: "${viewportOffsetDelta.left} ? 'left:' + ${arrowPositionLeft} + '%' : ${viewportOffsetDelta.top} ? 'top:' + ${arrowPositionTop} + '%' : ''",
          tooltipPositionLeft: "${tooltipPosition.left} + ${viewportOffsetDelta.left}",
          tooltipPositionRight: "${tooltipPosition.top}  + ${viewportOffsetDelta.top}",
          tooltipStyle: "'left:' + ${tooltipPositionLeft} + 'px;top:' + ${tooltipPositionRight} + 'px;opacity:' + ${tooltipOpacity}"
        },
        data: {
          hidden: true,
          options: options,
          targetRect: createRect(targetNode, true),
          tooltipOpacity: 0.0,
          tooltipRect: {
            top: 0,
            left: 0,
            height: 0,
            width: 0
          },
          tooltipPosition: {
            top: 0,
            left: 0
          },
          viewportOffsetDelta: {
            top: 0,
            left: 0
          },
          placement: 'top'
        },
        interpolators: {
          float: function(from, to) {
            var dist, forward, fromFl, toFl;
            fromFl = parseFloat(from);
            toFl = parseFloat(to);
            if (isNaN(fromFl || isNaN(toFl))) {
              return null;
            }
            dist = Math.abs(toFl - fromFl);
            forward = toFl > fromFl;
            if (dist <= 0.01) {
              return function() {
                return to;
              };
            }
            return function(t) {
              if (!forward) {
                t = -t;
              }
              return from + (t * dist);
            };
          }
        },
        _scrollAdjustedTargetRect: function() {
          var scrollAdjustedRect, targetRect, viewportRect;
          viewportRect = this.data.viewportRect;
          targetRect = this.data.targetRect;
          scrollAdjustedRect = createRect(targetRect, true);
          scrollAdjustedRect.top -= viewportRect.scroll;
          scrollAdjustedRect.bottom -= viewportRect.scroll;
          return scrollAdjustedRect;
        },
        getViewportOffsetDelta: function() {
          var bottomOffset, delta, leftOffset, rightOffset, tooltipPos, tooltipRect, topOffset, viewportRect;
          viewportRect = this.get('viewportRect');
          tooltipRect = this.get('tooltipRect');
          tooltipPos = this.get('tooltipPosition');
          delta = {
            top: 0,
            left: 0
          };
          switch (tooltipPos.placement) {
            case 'top':
            case 'bottom':
              leftOffset = tooltipPos.left;
              rightOffset = tooltipPos.right;
              if (leftOffset < viewportRect.left) {
                delta.left = viewportRect.left - leftOffset;
              } else if (rightOffset > viewportRect.width) {
                delta.left = viewportRect.right - rightOffset;
              }
              break;
            case 'left':
            case 'right':
              topOffset = tooltipPos.top - viewportRect.scroll;
              bottomOffset = tooltipPos.top + viewportRect.scroll + tooltipRect.height;
              if (topOffset < viewportRect.top) {
                delta.top = viewportRect.top - topOffset;
              } else if (bottomOffset > viewportRect.bottom) {
                delta.top = viewportRect.bottom - bottomOffset;
              }
          }
          return delta;
        },
        getTooltipPosition: function(next) {
          var arrow, autoPlacement, getFinalPosition, placement, targetRect, tooltipRect, viewport, viewportRect;
          if (!next) {
            next = function() {
              return true;
            };
          }
          options = this.get('options');
          targetRect = this.get('targetRect');
          tooltipRect = this.get('tooltipRect');
          viewportRect = this.get('viewportRect');
          arrow = this.nodes.raTooltip.querySelector('.ra-tooltip-arrow');
          viewport = options.viewport || 'body';
          placement = options.placement;
          autoPlacement = false;
          if (/\bauto\b/.test(placement)) {
            placement = placement.replace(/\s*\bauto\b\s*/, '');
            if (!placement) {
              placement = 'top';
            }
            autoPlacement = true;
          }
          getFinalPosition = (function(_this) {
            return function() {
              var bottomTop, centerLeft, centerTop, finalPosition, leftLeft, rightLeft, topTop;
              topTop = function() {
                return targetRect.top - tooltipRect.height - options.offsetY;
              };
              leftLeft = function() {
                return targetRect.left - tooltipRect.width - options.offsetX;
              };
              bottomTop = function() {
                return targetRect.bottom + options.offsetY;
              };
              rightLeft = function() {
                return targetRect.right + options.offsetX;
              };
              centerLeft = function() {
                return targetRect.left + Math.floor(targetRect.width / 2) - Math.floor(tooltipRect.width / 2);
              };
              centerTop = function() {
                return targetRect.top + Math.floor(targetRect.height / 2) - Math.floor(tooltipRect.height / 2);
              };
              finalPosition = (function() {
                switch (placement) {
                  case 'left':
                    return {
                      top: centerTop(),
                      left: leftLeft()
                    };
                  case 'right':
                    return {
                      top: centerTop(),
                      left: rightLeft()
                    };
                  case 'top':
                    return {
                      top: topTop(),
                      left: centerLeft()
                    };
                  case 'top-right':
                    return {
                      top: topTop(),
                      left: rightLeft()
                    };
                  case 'top-left':
                    return {
                      top: topTop(),
                      left: leftLeft()
                    };
                  case 'bottom':
                    return {
                      top: bottomTop(),
                      left: centerLeft()
                    };
                  case 'bottom-right':
                    return {
                      top: bottomTop(),
                      left: rightLeft()
                    };
                  case 'bottom-left':
                    return {
                      top: bottomTop(),
                      left: leftLeft()
                    };
                }
              })();
              finalPosition.placement = placement;
              return next.call(_this, finalPosition);
            };
          })(this);
          return this.set('placement', placement, function() {
            var offBottom, offLeft, offRight, offTop, origPlacement;
            tooltipRect = createRect(this.nodes.raTooltip);
            viewportRect = createRect(options.viewport, true);
            if (autoPlacement) {
              origPlacement = placement;
              offBottom = function() {
                return targetRect.bottom + tooltipRect.height - viewportRect.scroll > viewportRect.height;
              };
              offTop = function() {
                return targetRect.top - viewportRect.scroll - tooltipRect.height < 0;
              };
              offRight = function() {
                return targetRect.right + tooltipRect.width > viewportRect.width;
              };
              offLeft = function() {
                return targetRect.left - tooltipRect.width < viewportRect.left;
              };
              placement = (function() {
                switch (placement) {
                  case 'bottom':
                    if (offBottom()) {
                      return 'top';
                    } else {
                      return placement;
                    }
                    break;
                  case 'top':
                    if (offTop()) {
                      return 'bottom';
                    } else {
                      return placement;
                    }
                    break;
                  case 'right':
                    if (offRight()) {
                      return 'left';
                    } else {
                      return placement;
                    }
                    break;
                  case 'left':
                    if (offLeft()) {
                      return 'right';
                    } else {
                      return placement;
                    }
                    break;
                  case 'bottom-left':
                    if (offBottom() || offLeft()) {
                      return 'top-right';
                    } else {
                      return placement;
                    }
                    break;
                  case 'bottom-right':
                    if (offBottom() || offRight()) {
                      return 'top-left';
                    } else {
                      return placement;
                    }
                    break;
                  case 'top-left':
                    if (offTop() || offLeft()) {
                      return 'bottom-right';
                    } else {
                      return placement;
                    }
                    break;
                  case 'top-right':
                    if (offTop() || offRight()) {
                      return 'bottom-left';
                    } else {
                      return placement;
                    }
                    break;
                  default:
                    return placement;
                }
              })();
              return this.set('placement', placement, getFinalPosition);
            } else {
              return getFinalPosition();
            }
          });
        },
        pointIntersectsTarget: function(x, y) {
          var r;
          r = createRect(targetNode, true);
          if (x < r.left || y < r.top || x > r.right || y > r.bottom) {
            return false;
          }
          return true;
        },
        show: function() {
          var d;
          this.set('viewportRect', createRect(this.data.options.viewport, true));
          this.set('targetRect', createRect(targetNode, true));
          this.set('tooltipRect', createRect(this.nodes.raTooltip));
          d = new Ractive.Promise(function(fulfil, reject) {
            return this.getTooltipPosition(function(position) {
              return this.set('tooltipPosition', position, function() {
                this.set('tooltipRect', createRect(this.nodes.raTooltip));
                return this.set('viewportOffsetDelta', this.getViewportOffsetDelta(), (function(_this) {
                  return function() {
                    return _this.animate('tooltipOpacity', 1.0, {
                      duration: _this.data.options.showAnimationDuration,
                      easing: 'linear',
                      interpolator: 'float',
                      complete: function(t, value) {
                        _this.set('hidden', false);
                        return fulfil([t, value]);
                      }
                    });
                  };
                })(this));
              });
            });
          });
          return d;
        },
        hide: function() {
          return this.animate('tooltipOpacity', 0.0, {
            duration: this.data.options.hideAnimationDuration,
            easing: 'linear',
            interpolator: 'float',
            complete: (function(_this) {
              return function() {
                return _this.set('hidden', true);
              };
            })(this)
          });
        },
        setContent: function(newContent) {
          if (this.get('hidden')) {
            return this.hide().then((function(_this) {
              return function() {
                _this.set('options.content', newContent);
                return _this.show();
              };
            })(this));
          } else {
            return this.set('options.content', newContent);
          }
        }
      });
    };
    template = "<div id=\"raTooltip\" style=\"{{tooltipStyle}}\" class=\"ra-tooltip {{placement}}\">\n  <div class=\"ra-tooltip-inner\">\n    {{{options.content}}}\n  </div>\n  <div class=\"ra-tooltip-arrow\" style=\"{{arrowStyle}}\"></div>\n</div>";
    TooltipDecorator = (function() {
      TooltipDecorator.options = {
        "default": {
          debug: false,
          template: template,
          placement: 'auto top',
          offsetX: 0,
          offsetY: 0,
          timeout: 10000,
          delay: 500,
          viewport: 'body',
          hideAnimationDuration: 200,
          showAnimationDuration: 200
        }
      };

      TooltipDecorator.prototype.mouseIsOver = false;

      TooltipDecorator.prototype.rendered = false;

      TooltipDecorator.prototype.options = null;

      TooltipDecorator.prototype.delayTimer = null;

      TooltipDecorator.prototype.timeoutTimer = null;

      TooltipDecorator.prototype.node = null;

      TooltipDecorator.prototype.tooltipView = null;

      function TooltipDecorator(node, group, content) {
        var _base;
        this.node = node;
        if (arguments.length === 2) {
          content = group;
          group = 'default';
        }
        (_base = this.constructor.options)[group] || (_base[group] = {});
        this.options = extend({}, this.constructor.options["default"], this.constructor.options[group]);
        this.options.content = content;
        this.windowMousemoveHandler = this.windowMousemoveHandler.bind(this);
        this.nodeMousemoveHandler = this.nodeMousemoveHandler.bind(this);
        this.node.addEventListener('mousemove', this.nodeMousemoveHandler, false);
        this.tooltipView = createTooltipView(this.node, this.options);
        return this;
      }

      TooltipDecorator.prototype.teardown = function() {
        window.removeEventListener('mousemove', this.windowMousemoveHandler);
        this.node.removeEventListener('mousemove', this.nodeMouseoverHandler, false);
        return this.tooltipView.teardown();
      };

      TooltipDecorator.prototype.windowMousemoveHandler = function(evt) {
        if (!this.mouseIsOver) {
          return;
        }
        if (!this.tooltipView.pointIntersectsTarget(evt.pageX, evt.pageY)) {
          return this.mouseleave(evt);
        }
      };

      TooltipDecorator.prototype.nodeMousemoveHandler = function(evt) {
        this.resetTimers();
        if (this.rendered) {
          this.showTimeout();
        } else {
          if (!this.mouseIsOver) {
            this.mouseenter(evt);
          }
          this.delayTimeout().then((function(_this) {
            return function() {
              _this.showTimeout();
              return _this.show();
            };
          })(this));
        }
      };

      TooltipDecorator.prototype.mouseenter = function() {
        this.mouseIsOver = true;
        return window.addEventListener('mousemove', this.windowMousemoveHandler, false);
      };

      TooltipDecorator.prototype.mouseleave = function() {
        this.mouseIsOver = false;
        window.removeEventListener('mousemove', this.windowMousemoveHandler, false);
        this.resetTimers();
        return this.hide();
      };

      TooltipDecorator.prototype.resetTimers = function() {
        if (this.timeoutTimer) {
          clearTimeout(this.timeoutTimer);
          this.timeoutTimer = null;
        }
        if (this.delayTimer) {
          clearTimeout(this.delayTimer);
          this.delayTimer = null;
        }
      };

      TooltipDecorator.prototype.delayTimeout = function() {
        var d;
        d = new Ractive.Promise(function(fulfil, reject) {
          if (this.options.delay) {
            return this.delayTimer = setTimeout((function(_this) {
              return function() {
                return fulfil();
              };
            })(this), this.options.delay);
          } else {
            return fulfil();
          }
        });
        return d;
      };

      TooltipDecorator.prototype.showTimeout = function() {
        if (this.options.timeout) {
          this.timeoutTimer = setTimeout((function(_this) {
            return function() {
              if (_this.rendered && _this.mouseIsOver) {
                return _this.mouseleave();
              }
            };
          })(this), this.options.timeout);
        }
      };

      TooltipDecorator.prototype.hide = function() {
        this.rendered = false;
        return this.tooltipView.hide();
      };

      TooltipDecorator.prototype.show = function() {
        this.rendered = true;
        return this.tooltipView.show();
      };

      return TooltipDecorator;

    })();
    if (typeof module !== 'undefined' && module.exports) {
      return module.exports = TooltipDecorator;
    } else if (typeof define === 'function' && define.amd) {
      return define(function() {
        return TooltipDecorator;
      });
    } else {
      return root.TooltipDecorator = TooltipDecorator;
    }
  })(typeof window === 'undefined' ? this : window);

}).call(this);
