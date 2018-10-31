import React, {Component} from 'react'
import {withTheme} from "../theme";
import {createMaterialTopTabNavigator, createStackNavigator, createSwitchNavigator} from "react-navigation";
import {Home, Login, Loved, Proof, Topics} from "../screens";
import LineIcon from 'react-native-vector-icons/SimpleLineIcons'
import Header from "./Header";
import Tabs from "./Tabs";
import HeaderTitle from "./HeaderTitle";

export const Routes = {
    Login: 'LOGIN',
    Home: 'HOME',
    Loved: 'LOVED',
    Stats: 'STATS',
    Topics: 'TOPICS',
    Proof: 'PROOF'
}

const Icon = ({focused, horizontal, tintColor, ...props}) => <LineIcon size={24} color={tintColor} {...props}/>

class RootNavigation extends Component {
    constructor(props) {
        super(props)

        const {theme} = this.props

        const tabOptions = {
            tabBarPosition: 'bottom',
            swipeEnabled: true,
            animationEnabled: true,
            lazy: true,
            tabBarComponent: props => <Tabs {...props}/>
        }

        const stackOptions = {
            header: (props) => <Header {...props}/>
        }

        this.Nav = createSwitchNavigator({
            [Routes.Login]: {
                screen: Login,
            },
            [Routes.Home]: createStackNavigator({
                [Routes.Home]: {
                    screen: createMaterialTopTabNavigator({
                        [Routes.Home]: {
                            screen: createStackNavigator({
                                [Routes.Home]: {
                                    screen: Home,
                                    navigationOptions: {headerTitle: <HeaderTitle text={'Matérias'}/>, ...stackOptions}
                                }
                            }),
                            navigationOptions: {
                                tabBarIcon: props => <Icon {...props} name={'graduation'}/>,
                                title: 'Estudar'
                            }
                        },
                        [Routes.Loved]: {
                            screen: createStackNavigator({
                                [Routes.Loved]: {
                                    screen: Loved,
                                    navigationOptions: {headerTitle: <HeaderTitle text={'Matérias Favoritos'}/>, ...stackOptions}
                                }
                            }),
                            navigationOptions: {
                                tabBarIcon: props => <Icon {...props} name={'heart'}/>,
                                title: 'Favoritos'
                            }
                        }
                    }, tabOptions),
                    navigationOptions: {header: null}
                },
                [Routes.Topics]: {
                    screen: Topics,
                    navigationOptions: ({navigation}) => ({
                        headerTitle: <HeaderTitle text={[['Matéria', (navigation.getParam('subject') || {}).t], 'Assuntos']}/>,
                        ...stackOptions
                    })
                },
                [Routes.Proof]: {
                    screen: Proof,
                    navigationOptions: ({navigation}) => ({
                        headerTitle: <HeaderTitle text={[['Matéria', (navigation.getParam('subject') || {}).t], ['Assunto', (navigation.getParam('topic') || {}).t]]}/>,
                        ...stackOptions
                    })
                },
            }, {navigationOptions: stackOptions})
        })
    }

    render() {
        return (<this.Nav/>)
    }
}

export default withTheme({}, RootNavigation)
