import React from 'react'
import {FlatList, StyleSheet} from 'react-native'
import {withTheme} from "../theme";
import withData from "../api/withData";
import ListItem, {ITEM_HEIGHT} from "../components/ListItem";
import Loading from "../components/Loading";
import Box from "../components/Box";
import Text from "../components/Text";
import Spacer from "../components/Spacer";
import LineIcon from 'react-native-vector-icons/SimpleLineIcons'
import {Routes} from "../navigation/RootNavigation";
import FireBase from 'react-native-firebase'
import {Events} from "../constants/Analytics";


class Home extends React.Component {

    componentDidMount() {
        console.log("Home:componentDidMount - Sending current screen to analytics...")
        FireBase.analytics().logEvent(Events.TenderSessionStart)
        FireBase.analytics().logEvent(Events.TenderOpenHome)
    }

    componentWillUnmount() {
        FireBase.analytics().logEvent(Events.TenderSessionEnd)
    }

    shouldComponentUpdate(nextProps) {
        return true
    }

    doOpenSubject = (subject) => {
        this.props.navigation.navigate(Routes.Topics, {subject})
    }

    render() {
        const {data, theme} = this.props
        const {styles} = theme

        return (
            <Box secondary fit>
                <Loading active={(data.subjectsLoading || data.lovedsLoading) && !data.dirty} size={56}>
                    <FlatList
                        ListHeaderComponent={<Spacer small vertical/>}
                        ListFooterComponent={<Spacer small vertical/>}
                        refreshing={data.subjectsLoading && data.dirty}
                        onRefresh={data.doUpdate}
                        style={styles.list}
                        data={data.subjects}
                        renderItem={
                            ({item, index}) =>
                                <ListItem index={index}
                                          subjectMeta={data.proofsSubjects[item.key]}
										  lovedKey={item.key}
                                          title={item.t}
                                          subtitle={`${item.c} questões`}
                                          onPress={() => this.doOpenSubject(item)}/>
                        }
                        ListEmptyComponent={
                            !data.subjectsLoading &&
                            <Box fit centralize column>
                                <Spacer vertical large/>
                                <Spacer vertical large/>
                                <Spacer vertical large/>
                                <LineIcon name={'graduation'} color={theme.palette.backgroundPrimaryTextSecondary}
                                          size={96}/>
                                <Spacer vertical large/>
                                <Text center style={{maxWidth: 240}} secondary>Nenhuma matéria para estudar =(</Text>
                            </Box>
                        }
                    />
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

export default withData(withTheme(styles, Home))
