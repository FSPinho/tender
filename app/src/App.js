import React, {Component} from 'react';
import ThemeProvider from "./theme/ThemeProvider";
import FireBase from 'react-native-firebase'
import RootNavigation from "./navigation/RootNavigation";
import DataProvider from "./api/DataProvider";

export default class App extends Component {

    async componentDidMount() {
        const enabled = await FireBase.messaging().hasPermission();
        if (enabled) {

        } else {
            try {
                await FireBase.messaging().requestPermission();
            } catch (error) {
            }
        }

        const notificationOpen = await FireBase.notifications().getInitialNotification();
        if (notificationOpen) {
            console.log("App opened by notification:", notificationOpen)
        }

        const fcmToken = await FireBase.messaging().getToken();
        if (fcmToken) {
            console.log("Initial token:", fcmToken)
        }

        this.onTokenRefreshListener = FireBase.messaging().onTokenRefresh(fcmToken => {
            console.log("onTokenRefresh:", fcmToken)
        });
        this.notificationDisplayedListener = FireBase.notifications().onNotificationDisplayed((notification) => {
            console.log("onNotificationDisplayed:", notification)
        });
        this.notificationListener = FireBase.notifications().onNotification((notification) => {
            console.log("onNotification:", notification)
        });
        this.notificationOpenedListener = FireBase.notifications().onNotificationOpened((notificationOpen) => {
            console.log("onNotificationOpened:", notificationOpen)
        });
    }

    componentWillUnmount() {
        this.notificationDisplayedListener();
        this.notificationListener();
        this.notificationOpenedListener();
        this.onTokenRefreshListener();
    }

    render() {
        return (
            <ThemeProvider>
                <DataProvider>
                    <RootNavigation/>
                </DataProvider>
            </ThemeProvider>
        );
    }
}