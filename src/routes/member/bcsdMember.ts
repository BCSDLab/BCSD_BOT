import {query, ResultSet} from "../../config/mysql";
import {getClientUserList} from "../../api/user";

export const syncMembers = async function () {

    let userList = await getClientUserList();
    const updatePromises: Promise<ResultSet> [] = [];

    userList.members!.forEach(member => {
        let email = member.profile!.email; // 이메일 추출
        let slackId = member.id; // 슬랙 ID 추출
        const sql = 'UPDATE member SET slack_id = ? WHERE email = ?';
        updatePromises.push(query(sql, [slackId, email]));
    });

    const results = await Promise.all(updatePromises);

    return results.reduce((acc: number, result: ResultSet) => {
        return acc + result.rows.affectedRows;
    }, 0);
};
