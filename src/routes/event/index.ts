import express from 'express';
import {boltApp} from '../../config/boltApp';
import {makeEvent} from '../../config/makeEvent';
import {getPRThreadInfo} from '../../api/internal';
import {getKoinShops} from '../../api/koin';
import {아이스브레이킹} from '../../const/comment';
import {ThreadBroadcastMessageEvent} from "@slack/bolt";
import { GenericMessageEvent } from '@slack/bolt';
import fs from "fs";

const eventRouter = express.Router();

// 응답 확인용
eventRouter.get('/', async (req, res) => {
    try {
        const data = await getPRThreadInfo({pullRequestLink: 'https://github.com/BCSDLab/KOIN_WEB_RECODE/pull/122'});

        res.send({
            message: JSON.stringify(data.data),
        });
    } catch (error) {
        res.send({message: JSON.stringify(error)});
    }
});

// 이벤트 구독
eventRouter.post('/', (req, res) => {
    // 이벤트 구독 확인 요청인 경우
    if (req.body.challenge && req.body.type === "url_verification") {
        return res.send({challenge: req.body.challenge});
    }
    const event = makeEvent(req, res);

    boltApp.processEvent(event);
});
// ---------설정---------

// 이벤트 핸들러 등록
boltApp.event('app_mention', async ({event, say}) => {
    await say(`Hello, <@${event.user}>!`);
});

boltApp.message('!회칙', async ({event, message, body}) => {
    const filePath = '/home/ubuntu/rule.pdf';
    const fileContent = fs.readFileSync(filePath);

    await boltApp.client.files.upload({
        channels: event.channel,
        initial_comment: 'BCSD Lab 회칙',
        file: fileContent,
        filename: 'BCSD Lab 회칙 ver.2024',
        filetype: 'pdf',
    });
});

boltApp.message('!가위바위보', async ({event}) => {
    const 가위바위보 = ['가위', '바위', '보'];
    const randomIndex = Math.floor(Math.random() * 가위바위보.length);
    const randomValue = 가위바위보[randomIndex];

    await boltApp.client.chat.postMessage({
        channel: event.channel,
        text: randomValue + '!',
        thread_ts: event.ts,
    });
});

boltApp.message('!주사위', async ({event}) => {
    const 주사위 = Math.floor(Math.random() * 6) + 1;

    await boltApp.client.chat.postMessage({
        channel: event.channel,
        text: `주사위 결과: ${주사위}`,
        thread_ts: event.ts,
    });
});

boltApp.message('!점메추', async ({event}) => {
    try {
        const shopList = (await getKoinShops()).data.shops.map(shop => shop.name);
        const randomIndex = Math.floor(Math.random() * shopList.length);
        let recommend = `${shopList[randomIndex]} 어떠세요?`;

        if (shopList[randomIndex].includes('콜밴') || shopList[randomIndex].includes('콜벤')) recommend = '오늘은 굶으세요.'
        await boltApp.client.chat.postMessage({
            channel: event.channel,
            text: recommend,
            thread_ts: event.ts,
        });
    } catch (error) {
        await boltApp.client.chat.postMessage({
            channel: event.channel,
            text: `점심 메뉴 추천을 가져오는 중 오류가 발생했습니다.`,
            thread_ts: event.ts,
        });
    }
});

boltApp.message(/(!축하|축하!)/, async ({event}) => {
    try {
        await boltApp.client.chat.postMessage({
            channel: event.channel,
            text: `:tada::tada::tada::tada::tada::tada::tada:`,
            thread_ts: event.ts,
        });
    } catch (error) {
        await boltApp.client.chat.postMessage({
            channel: event.channel,
            text: `어라 삐봇의 상태가`,
            thread_ts: event.ts,
        });
    }
});

boltApp.message(/(!감사|감사!)/, async ({event}) => {
    const emojis = [
        ':감사하트:', ':blob_bowing:', ':grand_zul:', ':meow_sparkle:', ':thank_you:', ':meow_party:', ':meow_heart:', ':blob-clap:'
        , ':blob_excited:', ':mario_luigi_dance:'
    ];
    const selectedEmojis = emojis.sort(() => 0.5 - Math.random()).slice(0, 6);
    const emojiText = selectedEmojis.join('');
    
    try {
        await boltApp.client.chat.postMessage({
            channel: event.channel,
            text: emojiText,
            thread_ts: event.ts,
        });
    } catch (error) {
        await boltApp.client.chat.postMessage({
            channel: event.channel,
            text: `어라 삐봇의 상태가`,
            thread_ts: event.ts,
        });
    }
});

const attemptCounts: { [key: string]: number } = {};

boltApp.message(/(!룰렛|룰렛!)/, async ({ event }) => {
    const emojis = [
        ':one:', ':two:', ':three:', ':four:', ':five:', ':six:', ':seven:', ':eight:', ':nine:', ':zero:'
    ];
    const selectedEmojis = Array.from({ length: 3 }, () => emojis[Math.floor(Math.random() * emojis.length)]);
    const emojiText = selectedEmojis.join('');
    

    try {
        const messageEvent = event as GenericMessageEvent;
        const userId = (event as GenericMessageEvent).user;
        attemptCounts[userId] = (attemptCounts[userId] || 0) + 1;

        if (attemptCounts[userId] > 3) {
            await boltApp.client.chat.postMessage({
                channel: messageEvent.channel,
                text: `<@${messageEvent.user}>님의 비공식 결과 ${emojiText} 오늘 시도 횟수 : ${attemptCounts[userId]}회`,
                thread_ts: messageEvent.ts,
            });
            return;
        }

        if (emojiText === ':seven::seven::seven:') {
            await boltApp.client.chat.postMessage({
                channel: messageEvent.channel,
                text: `:slot_machine: :tada::tada::tada: 축하합니다! ${emojiText} 당첨입니다! :tada::tada::tada: :slot_machine:`,
                thread_ts: messageEvent.ts,
            });
            await boltApp.client.chat.postMessage({
                channel: 'C4A8YJ66P',
                text: `:tada::tada::tada: <@${messageEvent.user}>님이 <#${messageEvent.channel}>에서 오늘 ${attemptCounts[userId]}번 시도만에 :seven::seven::seven:을 뽑으셨습니다! 축하해주세요!!!:tada::tada::tada:`,
            });

        } else {
            await boltApp.client.chat.postMessage({
                channel: messageEvent.channel,
                text: `<@${messageEvent.user}>님의 결과 ${emojiText} :meow_sad-rain:
오늘 남은 시도 횟수 : ${3 - attemptCounts[userId]}회`,
                thread_ts: messageEvent.ts,
            });
        }
    } catch (error) {
        await boltApp.client.chat.postMessage({
            channel: event.channel,
            text: `어라 삐봇의 상태가`,
            thread_ts: event.ts,
        });
    }
});


boltApp.message('!아이스브레이킹', async ({event}) => {
    try {
        const randomIndex = Math.floor(Math.random() * 아이스브레이킹.length);
        const 아이스브레이킹주제 = 아이스브레이킹[randomIndex];

        await boltApp.client.chat.postMessage({
            channel: event.channel,
            text: `${아이스브레이킹주제}`,
        })
    } catch (error) {
        await boltApp.client.chat.postMessage({
            channel: event.channel,
            text: `갑분싸....`,
            thread_ts: event.ts,
        });
    }
});

boltApp.message('!추첨', async ({event, message}) => {
    try {
        const threadInfo = await boltApp.client.conversations.replies({
            channel: event.channel,
            ts: (message as ThreadBroadcastMessageEvent).thread_ts ?? event.ts,
        });

        if (threadInfo.ok) {
            const participants = threadInfo.messages![0].reactions?.find(reaction => reaction.name === 'hand')?.users;
            if (participants == null) {
                await boltApp.client.chat.postMessage({
                    channel: event.channel,
                    text: `추첨 대상이 없습니다 :cry:`,
                    thread_ts: event.ts,
                });
                return;
            }

            const randomIndex = Math.floor(Math.random() * participants.length);
            const winner = participants[randomIndex];

            await boltApp.client.chat.postMessage({
                channel: event.channel,
                text: `:hand: 이모지를 단 인원 ${participants.length}명 중 한명을 추첨한 결과를 발표합니다!\n<@${winner}>님, 선정되셨습니다! 축하합니다! :tada:`,
                thread_ts: event.ts,
            });
            return;
        }
        await boltApp.client.chat.postMessage({
            channel: event.channel,
            text: `추첨 대상이 없습니다 :cry:`,
            thread_ts: event.ts,
        });

    } catch (error) {
        await boltApp.client.chat.postMessage({
            channel: event.channel,
            text: `추첨을 진행하는 중 오류가 발생했습니다.`,
            thread_ts: event.ts,
        });
    }
});

boltApp.message(/!?투표!? (\d+~\d+)/, async ({ event, client }) => {
    const delay = (ms: number | undefined) => new Promise(resolve => setTimeout(resolve, ms));
    if (typeof event.subtype !== 'undefined') return;

    const messageText = event.text?.trim() || "";
    const rangeMatch = messageText.match(/\d+~\d+/);

    if (rangeMatch) {
        const [start, end] = rangeMatch[0].split('~').map(Number);

        if (isNaN(start) || isNaN(end) || start < 1 || end > 10 || start > end) {
            await client.chat.postMessage({
                channel: event.channel,
                text: '1~9 사이의 숫자 범위를 입력해주세요.',
                thread_ts: event.ts,
            });
            return;
        }

        const numberEmojis = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
        
        try {
            for (let i = start - 1; i < end; i++) {
                await client.reactions.add({
                    channel: event.channel,
                    name: numberEmojis[i],
                    timestamp: event.ts,
                });
                await delay(800);
            }
        } catch (error) {
            console.error(error);
        }
    }
});

// boltApp.message(/(!투표결과|투표결과!)/, async ({ event, client }) => {
//     if (typeof event.subtype !== 'undefined') return;

//     try {
//         const result = await client.reactions.get({
//             channel: event.channel,
//             timestamp: event.thread_ts || event.ts,
//         });

//         const reactions = result.message?.reactions || [];
//         const emojiVotes: { [key: string]: string[] } = {};

//         reactions.forEach(reaction => {
//             if (reaction.name && reaction.users) {
//                 emojiVotes[reaction.name] = reaction.users.map(user => `<@${user}>`);
//             }
//         });

//         let voteResults = "최다 투표 결과입니다.\n";
//         let maxVotes = 0;
//         const maxVotedEmojis = [];

//         for (const [emoji, voters] of Object.entries(emojiVotes)) {
//             const voteCount = voters.length;
//             if (voteCount > maxVotes) {
//                 maxVotes = voteCount;
//                 maxVotedEmojis.length = 0;
//                 maxVotedEmojis.push({ emoji, voters });
//             } else if (voteCount === maxVotes) {
//                 maxVotedEmojis.push({ emoji, voters });
//             }
//         }

//         maxVotedEmojis.forEach(({ emoji, voters }) => {
//             voteResults += `:${emoji}: : ${voters.join(', ')}\n`;
//         });

//         await client.chat.postMessage({
//             channel: event.channel,
//             text: voteResults,
//             thread_ts: event.ts,
//         });
//     } catch (error) {
//         console.error(error);
//         await client.chat.postMessage({
//             channel: event.channel,
//             text: "투표 결과를 불러오는 데 문제가 발생했습니다.",
//             thread_ts: event.ts,
//         });
//     }
// });

interface Channel {
    id: string;
    is_member?: boolean;
}

interface ConversationsListResponse {
    channels: Channel[];
    response_metadata: {
        next_cursor: string;
    };
}

const getAllChannelIds = async (client: any): Promise<string[]> => {
    let channelIds: string[] = [];
    let cursor: string | undefined;

    try {
        do {
            const response: ConversationsListResponse = await client.conversations.list({
                limit: 1000,
                cursor: cursor,
                types: 'public_channel,private_channel',
                exclude_archived: true,
            });
            response.channels.forEach(channel => {
                if (channel.is_member) {
                    channelIds.push(channel.id);
                }
            });
            cursor = response.response_metadata.next_cursor;
        } while (cursor);

        return channelIds;
    } catch (error) {
        console.error('Error fetching channel IDs:', error);
        return [];
    }
};


interface Reaction {
    name?: string;
    count?: number;
}

interface Message {
    user?: string;
    thread_ts?: string;
    ts?: string;
    reactions?: Reaction[];
    text?: string;
}

interface HistoryResponse {
    messages?: Message[];
}

interface RepliesResponse {
    messages?: Message[];
}

boltApp.message(/(!상태창|상태창!)/, async ({ event, client }) => {
    const messageEvent = event as GenericMessageEvent;
    const userId = messageEvent.user;
    const oneWeekAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
    const channelIds = await getAllChannelIds(client);
    const threadTs = messageEvent.thread_ts || messageEvent.ts;
    let totalMessages = 0;
    let activeDays: { [key: string]: number } = {};
    let totalReactionsReceived = 0;
    let totalReactionsAdded = 0;
    let mostReactedMessage = { count: 0, link: '' };
    let emojiCount: { [key: string]: number } = {};
    let totalThreadsParticipated = 0;
    let totalMentionsReceived = 0;
    let totalMentionsMade = 0;

    try {
        for (const channelId of channelIds) {
            const response: HistoryResponse = await client.conversations.history({
                channel: channelId,
                oldest: oneWeekAgo.toString(),
                inclusive: true,
            });

            const mainMessages = response.messages || [];

            // 총 메시지 수 및 활성 날짜 계산
            totalMessages += mainMessages.filter(msg => msg.user === userId).length;
            mainMessages.forEach(message => {
                if (message.user === userId) {
                    const messageDate = new Date(Number(message.ts) * 1000).toISOString().split('T')[0];
                    activeDays[messageDate] = (activeDays[messageDate] || 0) + 1;

                    // 리액션 받은 횟수 계산
                    if (message.reactions) {
                        message.reactions.forEach(reaction => {
                            if (reaction.count !== undefined) {
                                totalReactionsReceived += reaction.count;
                            }
                            if (reaction.count !== undefined && reaction.count > mostReactedMessage.count) {
                                mostReactedMessage = {
                                    count: reaction.count,
                                    link: message.ts ? `<https://bcsdlab.slack.com/archives/${channelId}/p${message.ts.replace('.', '')}|바로가기>` : '링크를 생성할 수 없습니다.',
                                };
                            }
                        });
                    }
                }

                // 멘션 받은 횟수 계산
                if ('text' in message && typeof message.text === 'string' && message.text.includes(`<@${userId}>`)) {
                    totalMentionsReceived++;
                }
            });

            // 스레드 참여 수 계산 및 스레드 메시지 포함
            for (const message of mainMessages) {
                if (message.thread_ts && message.thread_ts === message.ts) {
                    const threadResponse: RepliesResponse = await client.conversations.replies({
                        channel: channelId,
                        ts: message.thread_ts,
                        oldest: oneWeekAgo.toString(),
                    });

                    const threadMessages = threadResponse.messages?.slice(1);
                    const userCommentsInThread = threadMessages?.filter(msg => msg.user === userId);

                    // 스레드에 사용자가 작성한 메시지 수 추가
                    if (userCommentsInThread && userCommentsInThread.length > 0) {
                        totalMessages += userCommentsInThread.length;
                        totalThreadsParticipated++;
                    }
                }
            }
        }

        // 리액션 추가한 기록 수집
        const reactionHistory = await client.reactions.list({ user: userId, oldest: oneWeekAgo });
        reactionHistory.items?.forEach(item => {
            if (item.message) {
                totalReactionsAdded++;
                item.message.reactions?.forEach(reaction => {
                    if (reaction.name) {
                        emojiCount[reaction.name] = (emojiCount[reaction.name] || 0) + 1;
                    }
                });
            }
        });

        // 가장 많이 추가한 이모지 찾기
        const mostAddedEmoji = Object.keys(emojiCount).reduce((a, b) => emojiCount[a] > emojiCount[b] ? a : b, '');

        // 가장 활발했던 날 찾기
        const mostActiveDay = Object.keys(activeDays).reduce((a, b) => activeDays[a] > activeDays[b] ? a : b, '');

        await client.chat.postMessage({
            channel: event.channel,
            text: `*<@${userId}>님의 일주일간 활동 기록*
총 메시지 수: ${totalMessages}
가장 활발했던 날: ${mostActiveDay}
이모지 받은 횟수: ${totalReactionsReceived}
추가한 이모지 횟수: ${totalReactionsAdded}
가장 많이 추가한 이모지: :${mostAddedEmoji}:
참여한 쓰레드 수: ${totalThreadsParticipated}
이모지 많이 받은 메시지: ${mostReactedMessage.link}`,
            thread_ts: threadTs,
        });
    } catch (error) {
        console.error(error);
        await client.chat.postMessage({
            channel: event.channel,
            text: `상태창을 불러오는 데 문제가 발생했습니다.
에러: ${error}`,
            thread_ts: threadTs,
        });
    }
});

boltApp.message(/^!삐봇qhdks123!$/, async ({ event, client }) => {
        const now = new Date();

        // 원하는 시간 시간, 분, 초 로 설정 (24시간 기준)
        let scheduledDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            0, 0, 0 
        );

        // 오늘 설정 시간이 이미 지난 경우, 내일 설정 시간으로 설정
        if (now > scheduledDate) {
            scheduledDate.setDate(scheduledDate.getDate() + 1);
        }

        const scheduledTime = Math.floor(scheduledDate.getTime() / 1000);

        // 예약 완료 메시지를 원본 메시지의 스레드에 전송

        // 메시지 예약 전송
        await client.chat.scheduleMessage({
            channel: 'C4A8YJ66P', // 예약할 채널 ID
            // 전송할 메시지 내용
            text: `2025년 새해가 밝았습니다!
다들 올해 원하는 목표 꼭 이루시길 바랍니다.
새해 복 많이 받으시고, 행복한 한 해 되세요. :tada:`, 
            post_at: scheduledTime, // 메시지 전송 시간 (Unix 타임스탬프)
        });

        const formattedTime = scheduledDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });

        await client.chat.postMessage({
            channel: event.channel,
            text: `예약메시지 설정이 완료되었습니다.
메시지는 ${formattedTime}에 발송됩니다.`,
            thread_ts: event.ts
        });
   
});



export default eventRouter;
