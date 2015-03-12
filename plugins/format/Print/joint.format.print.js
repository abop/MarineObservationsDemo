;(function() {

    var printEvents = 'onbeforeprint' in window;

    function beforePrint(opt, data) {

        var svg = V(this.svg);


        var paddingLeft = opt.paddingLeft || opt.padding;
        var paddingRight = opt.paddingRight || opt.padding;
        var paddingTop = opt.paddingTop || opt.padding;
        var paddingBottom = opt.paddingBottom || opt.padding;

        var bbox = this.getContentBBox().moveAndExpand({
            x: - paddingLeft,
            y: - paddingTop,
            width: paddingLeft + paddingRight,
            height: paddingTop + paddingBottom
        });

        // store original svg attributes
        data.attrs = {
            width: svg.attr('width'),
            height: svg.attr('height'),
            viewBox: svg.attr('viewBox')
        }

        // store original scrollbar position
        data.scrollLeft = this.el.scrollLeft;
        data.scrollTop = this.el.scrollTop;

        // stretch the content to the size of the container
        svg.attr({
            width: '100%',
            height: '100%',
            viewBox: [bbox.x, bbox.y, bbox.width, bbox.height].join(' ')
        });

        // append the paper straight to the body
        this.$el.addClass('printarea').addClass(opt.size);

        if (opt.detachBody) {

            // store reference to the paper parent and position
            data.$parent = this.$el.parent();
            data.index = data.$parent.children().index(this.$el);

            // detach everything from body and store it
            data.$content = $(document.body).children().detach();

            this.$el.appendTo(document.body);
        }
    }

    function afterPrint(opt, data) {

        var svg = V(this.svg);

        var isWebkit = !!window.chrome && !window.opera;
        var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

        // Note that IE 9 in order to delete attribute requires setting null,
        // calling `svg.node.removeAttribute('viewBox')` does not work there for some reason,
        // (not even the `removeAttributeNS()` version).
        // On the other hand Firefox doesn't like setting null for viewBox and throws a warning,
        // webkit-based browser throws an error.
        if ((isWebkit || isFirefox) && !data.attrs.viewBox) {

            svg.node.removeAttributeNS(null, 'viewBox');

            delete data.attrs.viewBox;
        }

        svg.attr(data.attrs);

        this.$el.removeClass('printarea').removeClass(opt.size)

        if (opt.detachBody) {

            // append the paper to its original parent and position
            if (data.$parent.children().length) {
                data.$parent.children().eq(data.index).before(this.$el);
            } else {
                this.$el.appendTo(data.$parent);
            }

            // append the original body
            data.$content.appendTo(document.body);
        }

        // restore original scrollbar position
        this.el.scrollLeft = data.scrollLeft;
        this.el.scrollTop = data.scrollTop;
    }

    joint.dia.Paper.prototype.print = function(opt) {

        opt = opt || {};

        _.defaults(opt, {
            size: 'a4', // allows adding custom sizes through css
            padding: 5,
            detachBody: true // can be disabled if detaching body is not found desired.
            /*
              In that case a custom css is required to position the paper to cover the entire screen
              and to hide all elements, whose presence are not desirable in the output print page. i.e:

              @media print {

                .printarea {
                  position: absolute;
                  left: 0px;
                  top: 0px;
                }

                .stencil, .inspector, .toolbar {
                  display: none;
                }
              }

            */
        });

        // data handovered between beforePrint and afterPrint
        var data = {};

        // create local versions of before/after methods
        var localBeforePrint = _.bind(beforePrint, this, opt, data);
        var localAfterPrint = _.bind(afterPrint, this, opt, data);

        // before print

        if (printEvents) {

            // Firefox and IE

            $(window).one('beforeprint', localBeforePrint);
            $(window).one('afterprint', localAfterPrint);

        } else {

            // Chrome, Opera, Safari

            localBeforePrint();
        }

        // print

        window.print();

        // after print

        if (!printEvents) {

            // Chrome, Opera, Safari

            var onceAfterPrint = _.once(localAfterPrint);

            // although mouseover works pretty reliably
            $(document).one('mouseover', onceAfterPrint);

            // to make sure an app won't get stuck without its original body, we'll adding delayed version
            _.delay(onceAfterPrint, 1000);
        }
    };

})();