import React, {Component} from 'react'
import FireBase from 'react-native-firebase'
import {Alert} from '../services'
import NameUtils from "../services/NameUtils";

const {Provider, Consumer} = React.createContext({
    data: undefined
});

export {Consumer}

class DataProvider extends Component {
    constructor(props) {
        super(props)

        this.state = {

            user: undefined,

            /** User data */
            historyMeta: undefined,
            historyLoading: false,

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

            doUpdate: this.doUpdate,
            doUpdateQuestions: this.doUpdateQuestions,
            doUpdateUser: this.doUpdateUser,
            doUpdateUserHistoryMeta: this.doUpdateUserHistoryMeta
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
        map.docs.map(d => list.push({...d.data(), key: d.id}))
        return list
    }

    doRemoveDuplicates = list => {
        const map = {}
        list.map(i => {
            map[i.key] = i
        })
        return Object.keys(map).map(k => map[k])
    }

    doUpdate = async () => {
        await this.asyncSetState({
            subjectsLoading: true,
            bancasLoading: true,
            historyLoading: true
        })

        await this.doOrAlert([async () => {
            console.log('DataProvider:doUpdate - Loading subject...')
            const subjects = await this.doMapToList(
                await FireBase.firestore()
                    .collection('subjects-topics')
                    .where('c', '>', 0)
                    .orderBy('c')
                    .get()
            )

            console.log(subjects)

            subjects.map(s => {
                s.o = Object.keys(s.o).map(key => ({...s.o[key], key}))
                s.o.sort((a, b) => a.t.localeCompare(b.t))
                s.o = s.o.filter(t => t.c > 10)
            })
            subjects.sort((a, b) => a.t.localeCompare(b.t))

            console.log('DataProvider:doUpdate - Loading bancas...')
            const bancas = []

            console.log('DataProvider:doUpdate - Loading history...')
            const history = []

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

    doUpdateQuestions = async (s, t, l = 3) => {

        console.log(s, t, l)

        await this.asyncSetState({questionsLoading: true})

        await this.doOrAlert([
            async () => {
                const baseQuery = await FireBase.firestore()
                    .collection('questions')
                    .where('s', '==', s)
                    .where('t', '==', t)

                const {historyMeta} = this.state

                let questions = await this.doMapToList(
                    historyMeta ?
                        (await baseQuery.orderBy('x').startAfter(historyMeta.lastQuestionIndex).limit(l).get())
                        : (await baseQuery.orderBy('x').limit(l).get())
                )

                if (questions.length < l) {
                    const offset = l - questions.length
                    console.log("DataProvider:doUpdateQuestions - Retrieved questions are not enough, getting more...", offset)
                    const questionsOffset = await this.doMapToList((await baseQuery.orderBy('x').limit(offset).get()))
                    await this.doUpdateUserHistoryMeta({
                        lastQuestionIndex: (questionsOffset[questionsOffset.length - 1] || questions[questions.length - 1] || []).x
                    })
                    questions = this.doRemoveDuplicates([...questions, ...questionsOffset])
                } else {
                    await this.doUpdateUserHistoryMeta({
                        lastQuestionIndex: questions[questions.length - 1].x
                    })
                }

                await this.asyncSetState({questions})
            }
        ], 'Não foi possível baixar as questões!')

        await this.asyncSetState({questionsLoading: false})
    }

    doUpdateUser = async ({user}) => {
        await this.asyncSetState({
            user: {
                key: user.uid,
                name: NameUtils.getName(user),
                firstName: NameUtils.getFirstName(user),
                lastName: NameUtils.getLastName(user),
                email: user.email,
                photo: user.photoURL
            },
            historyLoading: true,
        })

        const profileRef = FireBase.firestore()
            .collection('history')
            .doc(user.uid)
        const historySnapshot = await profileRef.get()
        await this.asyncSetState({
            historyMeta: historySnapshot.data(),
            historyLoading: false,
        })
    }

    doUpdateUserHistoryMeta = async (meta) => {
        if (!this.state.user)
            return

        await this.asyncSetState({historyLoading: true})

        const profileRef = FireBase.firestore()
            .collection('history')
            .doc(this.state.user.key)
        const historySnapshot = await profileRef.get()
        await profileRef.set({
            ...historySnapshot.data(),
            ...meta,
        })
        await this.asyncSetState({
            historyMeta: {
                ...historySnapshot.data(),
                ...meta,
            },
            historyLoading: false,
        })
    }

    render() {
        return (
            <Provider
                value={{
                    data: this.state
                }}>
                {this.props.children}
            </Provider>
        )
    }
}


export default DataProvider