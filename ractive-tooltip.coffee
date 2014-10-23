
((root) ->
  # adapted from ractive.js to avoid jquery use
  Ractive = root.Ractive

  if typeof Ractive == 'undefined'
    error = "Please install Ractive [http://www.ractivejs.org/]"
    #alert error
    console.error error
    #throw new Error error
    return

  extend = (target, sources...) ->
    while source = sources.shift()
      for own prop of source
        target[prop] = source[prop]
    return target

  testStyle = document.createElement('div').style
  vendors = [
    'moz'
    'webkit'
    'o'
    'ms'
  ]
  prefixCache = {}
  styleProp = (prop) ->
    prop = camelCase prop
    unless prefixCache[prop]
      if typeof testStyle[prop] != 'undefined'
        prefixCache[prop] = prop
      else
        capped = prop.charAt(0).toUpperCase() + prop.substring 1
        i = venders.length
        while i--
          vendor = vendors[i]
          if typeof testStyle[vendor + capped] != 'undefined'
            prefixCache[prop] = vendor + capped
            break
    return prefixCache[prop]

  camelCase = (hyphenatedStr) ->
    return hyphenatedStr.replace /-([a-zA-Z])/g, ( match, $1 ) ->
      return $1.toUpperCase()

  getStyle = (node, style) ->
    props = window.getComputedStyle node
    prop = styleProp style
    value = props.getPropertyValue(prop) || props[prop]
    if value == '0px'
      value = 0
    return value

  setStyle = (node, style, value) ->
    node.style[styleProp style] = value
    return node

  createTooltipView = (targetNode, options) ->

    createRect = (args...) ->
      r = top: 0, left: 0, height: 0, width: 0, bottom: 0, right: 0, _isRect: true
      if args.length < 3
        if args[0]._isRect
          {r} = args[0]
        else
          node    = if typeof args[0] == 'string' then document.querySelector args[0] else args[0]
          rect     = node.getBoundingClientRect()
          isBody   = node.tagName == 'BODY'
          r.marginTop = parseFloat(getStyle node, 'margin-top') || 0
          r.marginLeft = parseFloat(getStyle node, 'margin-left') || 0
          r.top    = rect.top
          r.left   = rect.left
          unless args[1]
            r.top  -= r.marginTop
            r.left -= r.marginLeft
          r.scroll = if isBody then document.documentElement.scrollTop || document.body.scrollTop else node.scrollTop
          # XXX no innerHeight on ie8
          r.height = if isBody then window.innerHeight || document.documentElement.clientHeight else node.offsetHeight
          r.width  = if isBody then window.innerWidth || document.documentElement.clientWidth  else node.offsetWidth
      else
        [r.top, r.left, r.height, r.width] = args

      r.right = r.left + r.width
      r.bottom = r.top + r.height

      return r

    return new Ractive
      el: options.viewport
      debug: options.debug
      append: true
      template: options.template
      computed:
        arrowPositionLeft: "Math.round(50 - ((${viewportOffsetDelta.left} / ${tooltipRect.width}) * 100))"
        arrowPositionTop:  "Math.round(50 - ((${viewportOffsetDelta.top} / ${tooltipRect.height}) * 100))"
        arrowStyle:        "${viewportOffsetDelta.left} ? 'left:' + ${arrowPositionLeft} + '%' : ${viewportOffsetDelta.top} ? 'top:' + ${arrowPositionTop} + '%' : ''"
        tooltipPositionLeft:  "${tooltipPosition.left} + ${viewportOffsetDelta.left}"
        tooltipPositionRight: "${tooltipPosition.top}  + ${viewportOffsetDelta.top}"
        tooltipStyle:         "'left:' + ${tooltipPositionLeft} + 'px;top:' + ${tooltipPositionRight} + 'px;opacity:' + ${tooltipOpacity}"
      data:
        hidden:         true
        options:        options
        targetRect:     createRect targetNode, true
        tooltipOpacity: 0.0
        tooltipRect:         top: 0, left: 0, height: 0, width: 0
        tooltipPosition:     top: 0, left: 0
        viewportOffsetDelta: top: 0, left: 0
        placement: 'top'
      interpolators:
        float: (from, to) ->
          fromFl = parseFloat from
          toFl = parseFloat to
          return null if isNaN fromFl or isNaN toFl
          dist = Math.abs(toFl - fromFl)
          forward = toFl > fromFl
          if dist <= 0.01
            return ->
              return to
          return (t) ->
            t = -t unless forward
            return from + (t * dist)

      _scrollAdjustedTargetRect: ->
        viewportRect               = @data.viewportRect
        targetRect                 = @data.targetRect
        scrollAdjustedRect         = createRect targetRect, true
        scrollAdjustedRect.top    -= viewportRect.scroll
        scrollAdjustedRect.bottom -= viewportRect.scroll
        return scrollAdjustedRect

      getViewportOffsetDelta: ->
        viewportRect = @get 'viewportRect'
        tooltipRect  = @get 'tooltipRect'
        tooltipPos   = @get 'tooltipPosition'
        delta        = top: 0, left: 0
        switch tooltipPos.placement
          when 'top', 'bottom'
            leftOffset = tooltipPos.left
            rightOffset = tooltipPos.right
            if leftOffset < viewportRect.left
              delta.left = viewportRect.left - leftOffset
            else if rightOffset > viewportRect.width
              delta.left = viewportRect.right - rightOffset
          when 'left', 'right'
            topOffset = tooltipPos.top - viewportRect.scroll
            bottomOffset = tooltipPos.top + viewportRect.scroll + tooltipRect.height
            if topOffset < viewportRect.top
              delta.top = viewportRect.top - topOffset
            else if bottomOffset > viewportRect.bottom
              delta.top = viewportRect.bottom - bottomOffset
        return delta

      getTooltipPosition: (next) ->
        unless next
          next = -> true
        options      = @get 'options'
        targetRect   = @get 'targetRect'
        tooltipRect  = @get 'tooltipRect'
        viewportRect = @get 'viewportRect'

        arrow = @nodes.raTooltip.querySelector('.ra-tooltip-arrow')
        viewport = options.viewport || 'body'
        placement = options.placement
        autoPlacement = false
        if /\bauto\b/.test placement
          placement = placement.replace /\s*\bauto\b\s*/, ''
          placement = 'top' unless placement
          autoPlacement = true

        getFinalPosition = =>
          topTop     = -> targetRect.top    - tooltipRect.height - options.offsetY
          leftLeft   = -> targetRect.left   - tooltipRect.width  - options.offsetX
          bottomTop  = -> targetRect.bottom + options.offsetY
          rightLeft  = -> targetRect.right  + options.offsetX
          centerLeft = -> targetRect.left   + Math.floor(targetRect.width / 2)  - Math.floor(tooltipRect.width  / 2)
          centerTop  = -> targetRect.top    + Math.floor(targetRect.height / 2) - Math.floor(tooltipRect.height / 2)
          finalPosition = switch placement
              when 'left'         then top: centerTop(), left: leftLeft()
              when 'right'        then top: centerTop(), left: rightLeft()
              when 'top'          then top: topTop(),    left: centerLeft()
              when 'top-right'    then top: topTop(),    left: rightLeft()
              when 'top-left'     then top: topTop(),    left: leftLeft()
              when 'bottom'       then top: bottomTop(), left: centerLeft()
              when 'bottom-right' then top: bottomTop(), left: rightLeft()
              when 'bottom-left'  then top: bottomTop(), left: leftLeft()

          finalPosition.placement = placement
          next.call @, finalPosition

        @set 'placement', placement, ->
          tooltipRect = createRect @nodes.raTooltip
          viewportRect = createRect options.viewport, true
          if autoPlacement
            origPlacement = placement
            offBottom = -> targetRect.bottom + tooltipRect.height  - viewportRect.scroll > viewportRect.height
            offTop    = -> targetRect.top    - viewportRect.scroll - tooltipRect.height < 0
            offRight  = -> targetRect.right  + tooltipRect.width   > viewportRect.width
            offLeft   = -> targetRect.left   - tooltipRect.width   < viewportRect.left
            placement = switch placement
              when 'bottom'
                if offBottom() then 'top'    else placement
              when 'top'
                if offTop()    then 'bottom' else placement
              when 'right'
                if offRight()  then 'left'   else placement
              when 'left'
                if offLeft()   then 'right'  else placement
              when 'bottom-left'
                if offBottom() or offLeft()  then 'top-right'    else placement
              when 'bottom-right'
                if offBottom() or offRight() then 'top-left'     else placement
              when 'top-left'
                if offTop()    or offLeft()  then 'bottom-right' else placement
              when 'top-right'
                if offTop()    or offRight() then 'bottom-left'  else placement
              else placement
            @set 'placement', placement, getFinalPosition
          else
            getFinalPosition()

      pointIntersectsTarget: (x, y) ->
        r = createRect targetNode, true
        if x < r.left or y < r.top or
            x > r.right or y > r.bottom
          return false
        return true

      show: ->
        @set 'viewportRect', createRect @data.options.viewport, true
        @set 'targetRect',   createRect targetNode, true
        @set 'tooltipRect',  createRect @nodes.raTooltip
        d = new Ractive.Promise (fulfil, reject) ->
          @getTooltipPosition (position) ->
            @set 'tooltipPosition', position, ->
              @set 'tooltipRect', createRect @nodes.raTooltip
              @set 'viewportOffsetDelta', @getViewportOffsetDelta(), =>
                @animate 'tooltipOpacity', 1.0,
                  duration:     @data.options.showAnimationDuration
                  easing:       'linear'
                  interpolator: 'float'
                  complete:     (t, value) =>
                    @set 'hidden', false
                    fulfil [t, value]
        return d
      hide: ->
        return @animate 'tooltipOpacity', 0.0,
          duration:     @data.options.hideAnimationDuration
          easing:       'linear'
          interpolator: 'float'
          complete:     =>
            @set 'hidden', true
      setContent: (newContent) ->
        if @get 'hidden'
          return @hide().then =>
            @set 'options.content', newContent
            @show()
        else
            @set 'options.content', newContent


  template = """
<div id="raTooltip" style="{{tooltipStyle}}" class="ra-tooltip {{placement}}">
  <div class="ra-tooltip-inner">
    {{{options.content}}}
  </div>
  <div class="ra-tooltip-arrow" style="{{arrowStyle}}"></div>
</div>
  """
  class TooltipDecorator
    @options:
      default:
        debug:     false
        template:  template
        placement: 'auto top'
        offsetX:   0
        offsetY:   0
        timeout:   10000
        delay:     500
        viewport: 'body'
        hideAnimationDuration: 200
        showAnimationDuration: 200

    mouseIsOver:  false
    rendered:     false
    options:      null
    delayTimer:   null
    timeoutTimer: null
    node:         null
    tooltipView:  null

    constructor: (@node, group, content) ->
      if arguments.length == 2
        content = group
        group = 'default'
      @constructor.options[group] or= {}
      @options = extend {}, @constructor.options.default, @constructor.options[group]
      @options.content = content
      @windowMousemoveHandler = @windowMousemoveHandler.bind @
      @nodeMousemoveHandler = @nodeMousemoveHandler.bind @
      @node.addEventListener 'mousemove', @nodeMousemoveHandler, false
      @tooltipView = createTooltipView @node, @options
      return @

    teardown: ->
      window.removeEventListener 'mousemove', @windowMousemoveHandler
      @node.removeEventListener 'mousemove', @nodeMouseoverHandler, false
      @tooltipView.teardown()

    windowMousemoveHandler: (evt) ->
      return unless @mouseIsOver
      unless @tooltipView.pointIntersectsTarget evt.pageX, evt.pageY
        @mouseleave evt

    nodeMousemoveHandler: (evt) ->
      @resetTimers()
      if @rendered
        @showTimeout()
      else
        if !@mouseIsOver
          @mouseenter evt
        @delayTimeout().then =>
          @showTimeout()
          @show()
      return

    mouseenter: ->
      @mouseIsOver = true
      window.addEventListener 'mousemove', @windowMousemoveHandler, false
    mouseleave: ->
      @mouseIsOver = false
      window.removeEventListener 'mousemove', @windowMousemoveHandler, false
      @resetTimers()
      @hide()

    resetTimers: ->
      if @timeoutTimer
        clearTimeout @timeoutTimer
        @timeoutTimer = null
      if @delayTimer
        clearTimeout @delayTimer
        @delayTimer = null
      return

    delayTimeout: ->
      d = new Ractive.Promise (fulfil, reject) ->
        if @options.delay
          @delayTimer = setTimeout =>
            fulfil()
          , @options.delay
        else
          fulfil()
      return d

    showTimeout: ->
      if @options.timeout
        @timeoutTimer = setTimeout =>
          @mouseleave() if @rendered and @mouseIsOver
        , @options.timeout
      return

    hide: ->
      @rendered = false
      return @tooltipView.hide()

    show: ->
      @rendered = true
      return @tooltipView.show()

  if typeof module != 'undefined' and module.exports
    module.exports = TooltipDecorator
  else if typeof define == 'function' and define.amd
    define -> TooltipDecorator
  else
    root.TooltipDecorator = TooltipDecorator

)(if typeof window == 'undefined' then this else window)

