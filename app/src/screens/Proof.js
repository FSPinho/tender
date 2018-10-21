import React from 'react'
import {StyleSheet} from 'react-native'
import {withTheme} from "../theme";
import withData from "../api/withData";
import Loading from "../components/Loading";
import Box from "../components/Box";
import QuestionItem from "../components/QuestionItem";

class Proof extends React.Component {

    constructor(props) {
        super(props)

        this.state = {}
    }

    async componentDidMount() {
        await this.props.data.doUpdateQuestions(this.subject.key, this.topic.key)
    }

    get topic() {
        return this.props.navigation.getParam('topic')
    }

    get subject() {
        return this.props.navigation.getParam('subject')
    }

    render() {
        const {theme, data} = this.props
        const {styles} = theme

        console.log(this.topic, this.subject)

        return (
            <Box secondary fit>
                <Loading active={false} size={56}>
                    <QuestionItem
                        text={'Doido das doidas'}
                        answers={[
                            {text: 'Some answer', correct: true},
                            {text: 'Some another answer Some another answerSome another answerSome another answerSome another answerSome another answerSome another answerSome another answerSome another answerSome another answer'},
                            {text: 'Some answer'},
                        ]}/>
                </Loading>
            </Box>
        )
    }
}

const styles = StyleSheet.create({})

export default withData(withTheme(styles, Proof))
