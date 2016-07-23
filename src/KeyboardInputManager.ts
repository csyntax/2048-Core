class KeyboardInputManager {
    private events: any;
    private eventTouchstart: string;
    private eventTouchmove: string;
    private eventTouchend: string;
    
    public constructor() {
        this.events = {};

        if (window.navigator.msPointerEnabled) {
            //Internet Explorer 10 style
            this.eventTouchstart = "MSPointerDown";
            this.eventTouchmove = "MSPointerMove";
            this.eventTouchend = "MSPointerUp";
        } else {
            this.eventTouchstart = "touchstart";
            this.eventTouchmove = "touchmove";
            this.eventTouchend = "touchend";
        }

        this.listen();
    }

    public on(event: string, callback: any): void {
        if (!this.events[event]) {
            this.events[event] = [];
        }

        this.events[event].push(callback);
    }

    public emit(event: string, data?: any): void {
        let callbacks = this.events[event];
            
        if (callbacks) {
            callbacks.forEach((callback: any) => {
                callback(data);
            });
        }
    }

    public listen(): void {
        let self: KeyboardInputManager = this;
        let map: any = {
            38: 0, // Up
            39: 1, // Right
            40: 2, // Down
            37: 3, // Left
            75: 0, // Vim up
            76: 1, // Vim right
            74: 2, // Vim down
            72: 3, // Vim left
            87: 0, // W
            68: 1, // D
            83: 2, // S
            65: 3  // A
        };

        document.addEventListener("keydown", (event: any) => {
            let modifiers: boolean = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
            let mapped: any = map[event.which];

            if (!modifiers) {
                if (mapped !== undefined) {
                    event.preventDefault();
                    self.emit("move", mapped);
                }
            }

            // R key restarts the game
            if (!modifiers && event.which === 82) {
                self.restart.call(self, event);
            }
        });

        // Respond to button presses
        this.bindButtonPress(".retry-button", this.restart);
        this.bindButtonPress(".restart-button", this.restart);
        this.bindButtonPress(".keep-playing-button", this.keepPlaying);

        // Respond to swipe events
        let touchStartClientX: number;
        let touchStartClientY: number;
        let gameContainer: Element = document.getElementsByClassName("game-container")[0];

        gameContainer.addEventListener(this.eventTouchstart, (event: any) => {
            if ((!window.navigator.msPointerEnabled && event.touches.length > 1) || event.targetTouches.length > 1) {
                return; // Ignore if touching with more than 1 finger
            }

            if (window.navigator.msPointerEnabled) {
                touchStartClientX = event.pageX;
                touchStartClientY = event.pageY;
            } else {
                touchStartClientX = event.touches[0].clientX;
                touchStartClientY = event.touches[0].clientY;
            }

            event.preventDefault();
        });

        gameContainer.addEventListener(this.eventTouchmove, (event: any) => {
            event.preventDefault();
        });

        gameContainer.addEventListener(this.eventTouchend, (event: any) => {
            if ((!window.navigator.msPointerEnabled && event.touches.length > 0) || event.targetTouches.length > 0) {
                return; // Ignore if still touching with one or more fingers
            }

            let touchEndClientX: number;
            let touchEndClientY: number;

            if (window.navigator.msPointerEnabled) {
           	    touchEndClientX = event.pageX;
                touchEndClientY = event.pageY;
            } else {
                touchEndClientX = event.changedTouches[0].clientX;
                touchEndClientY = event.changedTouches[0].clientY;
            }

            let dx: number = touchEndClientX - touchStartClientX;
            let absDx: number = Math.abs(dx);

            let dy: number = touchEndClientY - touchStartClientY;
            let absDy: number = Math.abs(dy);

            if (Math.max(absDx, absDy) > 10) {
                // (right : left) : (down : up)
                self.emit("move", absDx > absDy ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
            }
        });
    }

    public restart(event: any): void {
        event.preventDefault();

        this.emit("restart");
    };

    public keepPlaying(event: any): void {
        event.preventDefault();
        
        this.emit("keepPlaying");
    };

    public bindButtonPress(selector: string, fn: any): void {
        let button: Element = document.querySelector(selector);
        
        button.addEventListener("click", fn.bind(this));
        button.addEventListener(this.eventTouchend, fn.bind(this));
    };
}
