/* NotificationsJS */
/*
	
	Description
	============
	
	NotificationsJS is a light-weight javascript library for creating screen notifications with simple properties that can be changed to
	personalize them as necessary.
	
	Documentation
	==========
	
	Requirements -
		
		- Notification.js,
		- Javascript 1.8.5+
		
	Classes -
		
		Styler: Used to style notification elements as necessary.
		
		Notifications: Used to access and create notifications.
			Prototype Functions:
				Note: You will not need to use these functions unless you want to close or open a notification manually.
				
				- Deanimate(slideSpeed) - Used to hide the notification.
				- Animate(duration, slideSpeed) - Used to show the notification.
				- CloseAll() - Used to close all existing notifications.
				
			Existing notifications can be found in the Notifications.NotificationsList variable.
	
	Notification Arguments -
		
		#1 Widget Arguments - Javascript associative array with or without the below properties.
			
			duration: (Int) [*] - The duration that the notification remains on the screen. 
			position: (String / Int) [ bottom | middle | center | top | (any pixel amount) ] - Position of the notification on the screen in seconds.
			slideSpeed: (String) [ fast | normal | slow ] - How fast the notification slides on of the screen.
			text: (String) [*]  - The text that appears in the notification. 
			type: (String) [danger | success | warning | primary | default] - Defines the styling of the notification.
			
	Usage -
		
		Creating a Notification
		===============
		
		Create an instance of the main class 'Notifications' to create notifications.
		<!--
		[	var NotificationList = new Notifications();
		[	NotificationList.Notify();
		-->
		
		Customizing a Notification
		================
		
		Parsing properties to the Notify function allows customizations of the notification.
		<!--
		[ var NotificationList = new Notifications();
		[ NotificationList.Notify({
		[	duration: 5,
		[   position: "bottom",
		[	slideSpeed: "normal",
		[	text: "This is a danger warning!",
		[	type: "danger"
		[ });
		-->


*/

class Notifications {
	
	constructor() {
	/*	if(typeof window.JQuery == 'undefined') throw new Error("Jquery must be installed!"); */
		this.NotificationsList = [];
		
		setInterval(() => {
			for(var i in this.NotificationsList) {
				if(this.NotificationsList[i].exists == false) {
					this.NotificationsList.splice(i, 1);
				}
			}
		}, 500);
	}
	
	Notify(args) {
		this.NotificationsList.push(
			new Notify(args)
		);
	}
	
	CloseAll(speed) {
		var speed = speed || "normal";
		for(var i in this.NotificationsList) {
			if(!this.NotificationsList[i].closing) {
				this.NotificationsList[i].deanimate(this.NotificationsList[i], speed);
			}
		}
	}
}

class Styler {
	constructor() {
	
	}
	
	styleDefault(element) {
		element.style.position = "absolute";
		element.style.fontSize = "16px";
		element.style.paddingTop = "16px";
		element.style.paddingBottom = "16px";
		element.style.fontFamily = "helvetica";
		element.style.color = "white";
	}
	
	styleDefaultStyle(element) {
		this.styleDefault(element);
		element.style.border = "2px solid grey";
		element.style.backgroundColor = "#DFDCE3";
		element.style.color = "black";
	}
	
	styleDanger(element) {
		this.styleDefault(element);
		element.style.border = "2px solid #e54216";
		element.style.backgroundColor = "#FC4A1A";
	}
	
	styleSuccess(element) {
		this.styleDefault(element);
		element.style.border = "2px solid #07c610";
		element.style.backgroundColor = "#09e213";
	}
	
	stylePrimary(element) {
		this.styleDefault(element);
		element.style.border = "2px solid #3c9e8f";
		element.style.backgroundColor = "#4ABDAC";
	}
	
	styleWarning(element) {
		this.styleDefault(element);
		element.style.border = "2px solid orange";
		element.style.backgroundColor = "#F78733";
	}
}

class Notify {
	constructor(args) {
		this.exists = true;
		this.closing = false;
		if(typeof args == 'undefined') {
			args = {};
		}
		var Stylizer = new Styler();
		
		var self = this;
		var FONT_SIZE = 7;
		var PADDING_SIZE = 200;
		if(!args.hasOwnProperty("text")) {
			var text = "Notification!";
		} else {
			var text = args.text;
		}
		var duration = args.duration || 4;
		var slideSpeed = args.slideSpeed || "normal";
		this.durationTime = duration;
		this.Element = document.createElement("div");
		var textElement = document.createElement("p");
		var textNode = document.createTextNode(text);		
		var textSize = (textNode.length* FONT_SIZE);
		this.divSize =  PADDING_SIZE*2;

		
		var closeButtonElement = document.createElement("div");
		var closeText = document.createTextNode("x");
		closeButtonElement.style.fontFamily = "helvetica";
		closeButtonElement.style.fontSize = "14px";
		closeButtonElement.append(closeText);
		closeButtonElement.className = "notification_close";
		
		this.Element.appendChild(closeButtonElement);
		textElement.appendChild(textNode);
		textElement.style.margin = "0px";
		this.Element.appendChild(textElement);

		//this.Element.className = "danger_notification";
		var colorStyle = args.type || "primary";
		switch(colorStyle.toLowerCase()) {
			case "primary":
				Stylizer.stylePrimary(this.Element);
				break;
			case "success":
				Stylizer.styleSuccess(this.Element);
				break;
			case "danger":
				Stylizer.styleDanger(this.Element);
				break;
			case "warning":
				Stylizer.styleWarning(this.Element);
				break;
			case "default":
				Stylizer.styleDefaultStyle(this.Element);
				break;
			default:
				console.log("[Error]: Unrecognized notification type!");
				Stylizer.stylePrimary(this.Element);
				break;
		}
		this.Element.style.position = "absolute";
		this.Element.getElementsByTagName('p')[0].style.marginLeft = "30px";
		this.Element.childNodes[0].style.marginLeft = "10px";
		this.Element.childNodes[0].style.cursor = "pointer";
		this.Element.childNodes[0].addEventListener("click", function() {
			self.deanimate(self, slideSpeed);
		}, false);	
		this.Element.style.width = PADDING_SIZE*2;
		
		if(!isNaN(parseInt(args.position))) {
			this.Element.style.top = args.position + "px";
		} else {
			switch(args.position) {
				case "bottom":
					this.Element.style.top = (window.innerHeight- 100) + "px";
					break;
				case "top":
					this.Element.style.top = 30 + "px";
					break;
				case "middle":
					this.Element.style.top = (window.innerHeight/2) + "px";
					break;
				case "center":
					this.Element.style.top = (window.innerHeight/2) + "px";
					break;
				default:
					this.Element.style.top = (window.innerHeight- 100) + "px";
					break;
			}
		}
		var elementPosition = args.position || "bottom";
		
		this.Element.style.left = (window.innerWidth) + "px";
		if(document.body) {
			document.body.style.overflowX = "hidden";
		}
		document.body.append(this.Element);
		
		this.animate(duration*1000, slideSpeed);
	}
	
	animate(duration, slideSpeed) {
		var speed = 1;
		if(slideSpeed == "fast") { speed = 0.5; }
		if(slideSpeed == "slow") { speed = 2; }
		if(slideSpeed == "normal") { speed = 1; }
		var InitialLeft = parseInt(this.Element.style.left.substring(0,this.Element.style.left.length-2));
		
		var self = this;
		var elem = this.Element;
		var pos = InitialLeft;
		var divSize = this.divSize;
		var id = setInterval(frame, 2);
		var startTime = Date.now()/1000;
		function frame() {
			//console.log(InitialLeft - divSize);
			if(pos <= InitialLeft - divSize + 1) {
				clearInterval(id);
			} else {
				var now = Date.now()/1000;
				pos = Math.easeInOutExpo(now- startTime, InitialLeft, -(divSize), speed);
				elem.style.left = pos + 'px';
				elem.style.opacity = (now-startTime)/speed;
				
			}
		}
		
		setTimeout(() => {
			if(!self.closing) {
				self.closing = true;
				startTime = Date.now()/1000;
				var deframeId = setInterval(deframe, 2);
				function deframe() {
					if(pos >= (InitialLeft-divSize) + divSize -1) {
						clearInterval(deframeId);
						elem.remove();					
						self.exists = false;
					} else {
						var now = Date.now()/1000;
						pos = Math.easeInOutExpo(now-startTime, (InitialLeft-divSize), divSize, speed);
						elem.style.left = pos + 'px';
						elem.style.opacity = (1 - (now-startTime)) / speed;
					}
				}
			}
		}, duration);
	}
	
	deanimate(self, slideSpeed) {
		console.log("anim: "+self.closing);
		if(!self.closing) {
			self.closing = true;
			var speed = 1.5;
			if(slideSpeed == "fast") { speed = 0.75; }
			if(slideSpeed == "slow") { speed = 2.5; }
			if(slideSpeed == "normal") { speed = 1.5; }
			var InitialLeft = parseInt(this.Element.style.left.substring(0,this.Element.style.left.length-2));
			var pos = InitialLeft;
			var elem = this.Element;
			var divSize = this.divSize;
			
			var deframeId = setInterval(deframe, 5);
			var startTime = Date.now()/1000;
			function deframe() {
				if(pos >= InitialLeft + divSize -1) {
					clearInterval(deframeId);
					elem.remove();
					self.exists = false;
				} else {
					var now = Date.now()/1000;
					pos = Math.easeInOutExpo(now-startTime, InitialLeft, divSize, speed);
					elem.style.left = pos + 'px';
					elem.style.opacity = 1 - (now-startTime);
				}
			}
		}
	}

}


Math.easeInOutExpo = function (t, b, c, d) {
	return c * Math.sin(t/d * (Math.PI/2)) + b;
};


