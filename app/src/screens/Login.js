import React from 'react'
import {StyleSheet} from 'react-native'
import {withTheme} from "../theme";
import withData from "../api/withData";
import Loading from "../components/Loading";
import Box from "../components/Box";
import {GoogleSignin, GoogleSigninButton} from 'react-native-google-signin';
import firebase from 'react-native-firebase'
import Alert from "../services/Alert";
import {Routes} from "../navigation/RootNavigation";

class Login extends React.Component {

    constructor(props) {
        super(props)

        this.state = {
            loading: false
        }
    }

    changeLoading = async loading =>
        new Promise(a => this.setState({loading}, a))

    async componentDidMount() {
        await this.changeLoading(true)
        try {
            await GoogleSignin.configure()
            const data = await GoogleSignin.signInSilently()
            const credential = firebase.auth.GoogleAuthProvider.credential(data.idToken, data.accessToken)
            const currentUser = await firebase.auth().signInAndRetrieveDataWithCredential(credential)
            await this.props.data.doUpdateUser(currentUser)

            this.props.navigation.navigate(Routes.Home)
        } catch (e) {
            console.warn("Login:componentDidMount - SignInSilently login error:", e);
        }
        await this.changeLoading(false)
    }

    doSignIn = async () => {
        await this.changeLoading(true)
        try {
            await GoogleSignin.configure()
            const data = await GoogleSignin.signIn()
            const credential = firebase.auth.GoogleAuthProvider.credential(data.idToken, data.accessToken)
            const currentUser = await firebase.auth().signInAndRetrieveDataWithCredential(credential)
            this.props.data.doUpdateUser(currentUser)

            this.props.navigation.navigate(Routes.Home)
        } catch (e) {
            console.warn(e);
            Alert.showLongText("Não foi possível entrar com Google!")
        }
        await this.changeLoading(false)
    }

    render() {
        const {data, theme} = this.props
        const {styles} = theme

        return (
            <Box secondary fit>
                <Loading active={this.state.loading} size={56}>
                    <Box fit centralize>
                        <GoogleSigninButton
                            style={{width: 312, height: 48}}
                            size={GoogleSigninButton.Size.Wide}
                            color={GoogleSigninButton.Color.Dark}
                            onPress={this.doSignIn}/>
                    </Box>
                </Loading>
            </Box>
        )
    }
}

const styles = StyleSheet.create({
    list: {
        flex: 1
    }
})

export default withData(withTheme(styles, Login))
