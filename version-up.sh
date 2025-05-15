#!/bin/bash

echo "執行 $ENV_ASSIGN 發版"

# 確認是否安裝 jq
jq --version 2> /dev/null || echo "jq 未安裝 => https://medium.com/evan-fang/jq-%E5%91%BD%E4%BB%A4%E5%88%97json%E8%99%95%E7%90%86%E5%B7%A5%E5%85%B7-a553c8940ef5"
jq --version 2> /dev/null || exit 1

oldVersion=$(jq -r '.version' package.json)

case $ENV_ASSIGN in
    "major")
        npm version major # update X.0.0
        ;;
    "patch")
        npm version patch # update 0.0.X
        ;;
esac

sleep 0.5
newVersion=$(jq -r '.version' package.json)

if [ "$oldVersion" != "$newVersion" ]; then
    newTag="v${newVersion}"

    # ------
    git tag -d "v${newVersion}" 2> /dev/null
    # ------

    echo "output version --- $newTag"

    # 取得新舊版本之間的 commit 記錄
    commit_log=$(git log --pretty=format:'{"hash": "%H", "message": "%s", "author": "%an"},' "v$oldVersion"..HEAD | sed '$s/,$//' | jq -s .)

    # 如果 commit_log 有內容，則更新 CHANGELOG.md
    if [ -n "$commit_log" ]; then
        echo -e "\n## $newVersion - $(date +"%Y-%m-%d")" >> CHANGELOG.md
        echo "$commit_log" | jq -r '.[] | "- \(.message) (\(.author))"' >> CHANGELOG.md
        echo "CHANGELOG.md 已更新"
        git add CHANGELOG.md
    fi

    git add package.json
    git commit --amend -m "release: $newVersion"

    sleep 0.5
    git tag "$newTag" -a -m "$newTag" && echo "output tag --- $newTag"
else
    echo "no version change"
fi