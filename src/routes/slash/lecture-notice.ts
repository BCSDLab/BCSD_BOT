
import express from 'express';
import { boltApp } from '../../config/boltApp';
import { makeEvent } from '../../config/makeEvent';

const lectureNoticeRouter = express.Router();
lectureNoticeRouter.use(express.urlencoded());

lectureNoticeRouter.post('/', (req, res) => {
  const event = makeEvent(req, res);
  
  boltApp.processEvent(event);
})

let threadChannelId='';

// command - '/'명령을 처리하기 위해 사용
// ack - 명령 수신확인 메서드, body - 수신한 데이터
boltApp.command('/강의공지', async ({ ack, client, command, logger }) => {
  await ack()
  
  try {
    threadChannelId = command.channel_id
    // 모달 열기
    
    const result = await client.views.open({
      trigger_id: command.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'lecture_modal',
        title: {
          type: 'plain_text',
          text: '강의 공지',
        },
        blocks: [
          {
            type: 'input',
            block_id: 'location',
            label: {
              type: 'plain_text',
              text: '강의 장소는 어디인가요?',
            },
            element: {
              type: 'plain_text_input',
              action_id: 'location_input',
            },
          },
          {
            type: 'input',
            block_id: 'time',
            label: {
              type: 'plain_text',
              text: '강의 시간은 몇시인가요?',
            },
            element: {
              type: 'plain_text_input',
              action_id: 'time_input',
            },
          },    
          {
            type: 'input',
            block_id: 'checkbox_block',
            label: {
              type: 'plain_text',
              text: '온라인 진행 여부',
            },
            element: {
              type: 'checkboxes',
              action_id: 'checkbox_input',
              options: [
                {
                  text: {
                    type: 'plain_text',
                    text: '진행 여부',
                  },
                  value: 'option',
                },
              ],
            },
          },
        ],
        submit: {
          type: 'plain_text',
          text: 'Submit',
        },
      },
    });

    logger.info(result);
    
  } catch (error) {
    client.chat.postMessage({
      text: error as string,
      channel: command.channel_id,
    })
  }
});

boltApp.view({ callback_id: 'lecture_modal', type: 'view_submission' }, async ({ ack, view, context, client }) => {
  await ack({
    response_action: 'clear',
  });

  const location = view['state']['values']['location']['location_input']['value'];
  const time = view['state']['values']['time']['time_input']['value'];
  const online= view['state']['values']['checkbox_block']['checkbox_input']['value'];
  // 스레드에 멘션
  try {

    await client.chat.postMessage({
      token: context.botToken,
      channel: threadChannelId,
      text: `새로운 강의 공지\n장소: ${location}\n시간: ${time} 온라인여부 ${online}`,
    });

  } catch (error) {
      client.chat.postMessage({
        text: error as string,
        channel: threadChannelId,
      })
  }
});


export default lectureNoticeRouter