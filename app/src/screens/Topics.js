import React from 'react'
import {FlatList, StyleSheet, RefreshControl} from 'react-native'
import {withTheme} from "../theme";
import withData from "../api/withData";
import ListItem, {ITEM_HEIGHT} from "../components/ListItem";
import Loading from "../components/Loading";
import Box from "../components/Box";
import Text from "../components/Text";
import Spacer from "../components/Spacer";
import LineIcon from 'react-native-vector-icons/SimpleLineIcons'

class Topics extends React.Component {

    shouldComponentUpdate(nextProps) {
        return this.props.data.subjectsLoading !== nextProps.data.subjectsLoading
    }

    get items() {
        const subject = this.props.navigation.getParam('subject')
        if(subject) {
            return subject.o
        } else {
            return this.props.data.subjects
        }
    }

    render() {
        const {theme, data} = this.props
        const {styles} = theme

        return (
            <Box secondary fit>
                <Loading active={data.subjectsLoading && !data.dirty} size={56}>
                    <FlatList
                        ListHeaderComponent={<Spacer small vertical/>}
                        ListFooterComponent={<Spacer small vertical/>}
                        refreshing={data.subjectsLoading && data.dirty}
                        onRefresh={data.doUpdate}
                        style={styles.list}
                        data={this.items}
                        renderItem={
                            ({item, index}) =>
                                <ListItem index={index}
                                          title={item.t}
                                          subtitle={`${item.c} questões`}
                                          favorite={index % 7 === 0}/>
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
                                <Text secondary>Nenhuma matéria para estudar =(</Text>
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

export default withData(withTheme(styles, Topics))
