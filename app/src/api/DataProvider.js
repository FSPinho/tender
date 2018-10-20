import React, {Component} from 'react'
import FireBase from 'react-native-firebase'
import {Alert} from '../services'

const ENABLE_FAKE_DATA = __DEV__

const {Provider, Consumer} = React.createContext({
    data: {
        /** Questions data */
        subjects: [],
        subjectsTimestamp: 0,
        subjectsLoading: false,
        questions: [],
        questionsTimestamp: 0,
        questionsLoading: false,
        bancas: [],
        bancasTimestamp: 0,
        bancasLoading: false,

        /** User data */
        history: [],
        historyTimestamp: 0,
        historyLoading: false,

        doUpdate: () => {
        }
    }
});

export {Consumer}

class DataProvider extends Component {
    constructor(props) {
        super(props)

        this.state = {
            /** True if loaded at least once */
            dirty: false,

            /** Questions data */
            subjects: [],
            subjectsTimestamp: 0,
            subjectsLoading: false,
            questions: [],
            questionsTimestamp: 0,
            questionsLoading: false,
            bancas: [],
            bancasTimestamp: 0,
            bancasLoading: false,

            /** User data */
            history: [],
            historyTimestamp: 0,
            historyLoading: false,

            doUpdate: this.doUpdate
        }
    }

    async componentDidMount() {
        await this.doUpdate()
    }

    asyncSetState = async state =>
        await new Promise(a => requestAnimationFrame(() => this.setState({...this.state, ...state}, a)))

    doOrAlert = async (toDos, errorMessage) => {
        try {
            for (let toDo of toDos) {
                await toDo()
            }
            ;
        } catch (e) {
            Alert.showLongText(errorMessage)
            console.warn('DataProvider:doOrAlert - Can\'t do tasks:', e)
        }
    }

    doMapToList = async map => {
        const list = []
        map.forEach(d => list.push({...d.val(), key: d.key}))
        return list
    }

    doUpdate = async () => {
        await this.asyncSetState({
            subjectsLoading: true,
            bancasLoading: true,
            historyLoading: true
        })

        await this.doOrAlert([async () => {
            console.log('DataProvider:doUpdate - Loading subject...')
            const subjects = ENABLE_FAKE_DATA ? require('./FakeData').default.subjectsTopics : await this.doMapToList(
                await FireBase.database()
                    .ref('public/subjects-topics')
                    .orderByChild("c")
                    .startAt(1).once()
            )
            subjects.map(s => {
                s.o = Object.keys(s.o).map(key => ({...s.o[key], key}))
            })

            console.log('DataProvider:doUpdate - Loading bancas...')
            const bancas = ENABLE_FAKE_DATA ? require('./FakeData').default.bancas : await this.doMapToList(
                await FireBase.database().ref('public/bancas').once()
            )

            console.log('DataProvider:doUpdate - Loading history...')
            const history = []// await this.doMapToList(await FireBase.database().ref('private/history').once())

            console.log('DataProvider:doUpdate - Data downloaded!')

            await this.asyncSetState({
                subjects,
                subjectsTimestamp: +new Date(),
                bancas,
                bancasTimestamp: +new Date(),
                history,
                historyTimestamp: +new Date(),
            })
        }], 'Oops, você está sem internet?')

        await this.asyncSetState({
            subjectsLoading: false,
            bancasLoading: false,
            historyLoading: false,
            dirty: true,
        })
    }

    render() {
        return (
            <Provider value={{data: this.state}}>
                {this.props.children}
            </Provider>
        )
    }
}


export default DataProvider