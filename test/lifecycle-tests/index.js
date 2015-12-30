var fs = require('fs');
var path = require('path');
var assert = require('assert');
var sinon = require('sinon');

var htmltemplateVdom = require('../..');
var runtime = require('../../lib/client/runtime');

var TICK = 1000;

describe('block lifecycle', function() {
    before(function() {
        var source = path.join(__dirname, 'template.tmpl');
        var target = path.join(__dirname, 'template.js');

        compile(source, target);

        this.target = target;
        this.render = require('./template');
        this.clock = sinon.useFakeTimers();
    });

    after(function() {
        fs.unlinkSync(this.target);
        this.clock.restore();
    });

    beforeEach(function() {
        var Header = this.Header = require('./blocks/header');
        var Sidebar = this.Sidebar = require('./blocks/sidebar');
        var Messages = this.Messages = require('./blocks/messages');

        this.headerWillMountSpy = sinon.spy();
        this.sidebarWillMountSpy = sinon.spy();
        this.messagesWillMountSpy = sinon.spy();
        this.headerDidMountSpy = sinon.spy();
        this.sidebarDidMountSpy = sinon.spy();
        this.messagesDidMountSpy = sinon.spy();
        this.headerWillUpdateSpy = sinon.spy();
        this.sidebarWillUpdateSpy = sinon.spy();
        this.messagesWillUpdateSpy = sinon.spy();
        this.headerDidUpdateSpy = sinon.spy();
        this.sidebarDidUpdateSpy = sinon.spy();
        this.messagesDidUpdateSpy = sinon.spy();
        this.headerWillUnmountSpy = sinon.spy();
        this.sidebarWillUnmountSpy = sinon.spy();
        this.messagesWillUnmountSpy = sinon.spy();

        Header.prototype.blockWillMount = this.headerWillMountSpy;
        Sidebar.prototype.blockWillMount = this.sidebarWillMountSpy;
        Messages.prototype.blockWillMount = this.messagesWillMountSpy;
        Header.prototype.blockDidMount = this.headerDidMountSpy;
        Sidebar.prototype.blockDidMount = this.sidebarDidMountSpy;
        Messages.prototype.blockDidMount = this.messagesDidMountSpy;
        Header.prototype.blockWillUpdate = this.headerWillUpdateSpy;
        Sidebar.prototype.blockWillUpdate = this.sidebarWillUpdateSpy;
        Messages.prototype.blockWillUpdate = this.messagesWillUpdateSpy;
        Header.prototype.blockDidUpdate = this.headerDidUpdateSpy;
        Sidebar.prototype.blockDidUpdate = this.sidebarDidUpdateSpy;
        Messages.prototype.blockDidUpdate = this.messagesDidUpdateSpy;
        Header.prototype.blockWillUnmount = this.headerWillUnmountSpy;
        Sidebar.prototype.blockWillUnmount = this.sidebarWillUnmountSpy;
        Messages.prototype.blockWillUnmount = this.messagesWillUnmountSpy;

        this.loop = runtime.mainLoop({}, this.render(runtime.h, {
            blocks: {
                Header: Header,
                Sidebar: Sidebar,
                Messages: Messages
            }
        }));

        this.clock.tick(TICK);
    });

    afterEach(function() {
        this.headerWillMountSpy.reset();
        this.sidebarWillMountSpy.reset();
        this.messagesWillMountSpy.reset();
        this.headerDidMountSpy.reset();
        this.sidebarDidMountSpy.reset();
        this.messagesDidMountSpy.reset();
        this.headerWillUpdateSpy.reset();
        this.sidebarWillUpdateSpy.reset();
        this.messagesWillUpdateSpy.reset();
        this.headerDidUpdateSpy.reset();
        this.sidebarDidUpdateSpy.reset();
        this.messagesDidUpdateSpy.reset();
        this.headerWillUnmountSpy.reset();
        this.sidebarWillUnmountSpy.reset();
        this.messagesWillUnmountSpy.reset();
    });

    describe('initial render', function() {
        it('should call blockWillMount', function() {
            assert.equal(this.headerWillMountSpy.callCount, 1);
            assert.equal(this.sidebarWillMountSpy.callCount, 1);
            assert.equal(this.messagesWillMountSpy.callCount, 0);
        });

        it('should call blockDidMount', function() {
            assert.equal(this.headerDidMountSpy.callCount, 1);
            assert.equal(this.sidebarDidMountSpy.callCount, 1);
            assert.equal(this.messagesDidMountSpy.callCount, 0);
        });

        it('should not call blockWillUpdate', function() {
            assert.equal(this.headerWillUpdateSpy.callCount, 0);
            assert.equal(this.sidebarWillUpdateSpy.callCount, 0);
            assert.equal(this.messagesWillUpdateSpy.callCount, 0);
        });

        it('should not call blockDidUpdate', function() {
            assert.equal(this.headerDidUpdateSpy.callCount, 0);
            assert.equal(this.sidebarDidUpdateSpy.callCount, 0);
            assert.equal(this.messagesDidUpdateSpy.callCount, 0);
        });

        it('should not call blockWillUnmount', function() {
            assert.equal(this.headerWillUnmountSpy.callCount, 0);
            assert.equal(this.sidebarWillUnmountSpy.callCount, 0);
            assert.equal(this.messagesWillUnmountSpy.callCount, 0);
        });
    });

    describe('successive render', function() {
        beforeEach(function() {
            this.loop.update({
                show_messages: true,
                messages: ['Hi']
            });

            this.clock.tick(TICK);
        });

        it('should call blockWillMount for just added blocks', function() {
            assert.equal(this.messagesWillMountSpy.callCount, 1);
        });

        it('should not call blockWillMount for untouched blocks', function() {
            assert.equal(this.headerWillMountSpy.callCount, 1);
            assert.equal(this.sidebarWillMountSpy.callCount, 1);
        });

        it('should call blockDidMount for just added blocks', function() {
            assert.equal(this.messagesDidMountSpy.callCount, 1);
        });

        it('should not call blockWillUpdate', function() {
            assert.equal(this.headerWillUpdateSpy.callCount, 0);
            assert.equal(this.sidebarWillUpdateSpy.callCount, 0);
            assert.equal(this.messagesWillUpdateSpy.callCount, 0);
        });

        it('should not call blockDidUpdate', function() {
            assert.equal(this.headerDidUpdateSpy.callCount, 0);
            assert.equal(this.sidebarDidUpdateSpy.callCount, 0);
            assert.equal(this.messagesDidUpdateSpy.callCount, 0);
        });

        it('should not call blockWillUnmount', function() {
            assert.equal(this.headerWillUnmountSpy.callCount, 0);
            assert.equal(this.sidebarWillUnmountSpy.callCount, 0);
            assert.equal(this.messagesWillUnmountSpy.callCount, 0);
        });
    });

    describe('series of flashing renders', function() {
        beforeEach(function() {
            this.loop.update({
                show_messages: true,
                messages: ['Hi']
            });

            this.clock.tick(TICK);

            this.loop.update({
                show_messages: false,
                hide_sidebar: true
            });

            this.clock.tick(TICK);

            this.loop.update({
                show_messages: true,
                messages: ['Hello']
            });

            this.clock.tick(TICK);
        });

        it('should call blockWillMount several times for updated blocks', function() {
            assert.equal(this.headerWillMountSpy.callCount, 1);
            assert.equal(this.messagesWillMountSpy.callCount, 2);
            assert.equal(this.sidebarWillMountSpy.callCount, 2);
        });

        it('should call blockDidMount several times for updated blocks', function() {
            assert.equal(this.headerDidMountSpy.callCount, 1);
            assert.equal(this.messagesDidMountSpy.callCount, 2);
            assert.equal(this.sidebarDidMountSpy.callCount, 2);
        });

        it('should not call blockWillUpdate', function() {
            assert.equal(this.headerWillUpdateSpy.callCount, 0);
            assert.equal(this.sidebarWillUpdateSpy.callCount, 0);
            assert.equal(this.messagesWillUpdateSpy.callCount, 0);
        });

        it('should not call blockDidUpdate', function() {
            assert.equal(this.headerDidUpdateSpy.callCount, 0);
            assert.equal(this.sidebarDidUpdateSpy.callCount, 0);
            assert.equal(this.messagesDidUpdateSpy.callCount, 0);
        });

        it('should not call blockWillUnmount for untouched blocks', function() {
            assert.equal(this.headerWillUnmountSpy.callCount, 0);
        });

        it('should not call blockWillUnmount for updated blocks', function() {
            assert.equal(this.sidebarWillUnmountSpy.callCount, 1);
            assert.equal(this.messagesWillUnmountSpy.callCount, 1);
        });
    });

    describe('series of updating renders', function() {
        beforeEach(function() {
            this.loop.update({
                show_messages: true,
                messages: ['Hi']
            });

            this.clock.tick(TICK);

            this.loop.update({
                show_messages: true,
                messages: ['Hello']
            });

            this.clock.tick(TICK);
        });

        it('should call blockWillMount only once for each block', function() {
            assert.equal(this.headerWillMountSpy.callCount, 1);
            assert.equal(this.messagesWillMountSpy.callCount, 1);
            assert.equal(this.sidebarWillMountSpy.callCount, 1);
        });

        it('should call blockDidMount only once for each block', function() {
            assert.equal(this.headerDidMountSpy.callCount, 1);
            assert.equal(this.messagesDidMountSpy.callCount, 1);
            assert.equal(this.sidebarDidMountSpy.callCount, 1);
        });

        it('should not call blockWillUpdate for blocks whose properties were unchanged', function() {
            assert.equal(this.headerWillUpdateSpy.callCount, 0);
            assert.equal(this.sidebarWillUpdateSpy.callCount, 0);
        });

        it('should not call blockDidUpdate for blocks whose properties were unchanged', function() {
            assert.equal(this.headerDidUpdateSpy.callCount, 0);
            assert.equal(this.sidebarDidUpdateSpy.callCount, 0);
        });

        it('should call blockWillUpdate for blocks whose properties were changed', function() {
            assert.equal(this.messagesWillUpdateSpy.callCount, 1);
        });

        it('should call blockDidUpdate for blocks whose properties were changed', function() {
            assert.equal(this.messagesDidUpdateSpy.callCount, 1);
        });

        it('should not call blockWillUnmount', function() {
            assert.equal(this.headerWillUnmountSpy.callCount, 0);
            assert.equal(this.sidebarWillUnmountSpy.callCount, 0);
            assert.equal(this.messagesWillUnmountSpy.callCount, 0);
        });
    });
});

function compile(source, target) {
    var template = fs.readFileSync(source, 'utf8');
    var compiled = htmltemplateVdom.compile.fromString(template, {
        path: source
    });

    fs.writeFileSync(target, compiled);
}
